/**
 * Cache Service
 *
 * Gestiona el cache del navegador (localStorage, sessionStorage, memoria)
 * Proporciona métodos para limpiar todos los tipos de cache
 */

class CacheService {
  /**
   * Limpia todo el localStorage
   */
  static clearLocalStorage() {
    try {
      localStorage.clear();
      console.log("✓ LocalStorage limpiado");
    } catch (error) {
      console.error("Error al limpiar localStorage:", error);
    }
  }

  /**
   * Limpia todo el sessionStorage
   */
  static clearSessionStorage() {
    try {
      sessionStorage.clear();
      console.log("✓ SessionStorage limpiado");
    } catch (error) {
      console.error("Error al limpiar sessionStorage:", error);
    }
  }

  /**
   * Limpia datos específicos de autenticación
   */
  static clearAuthData() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      console.log("✓ Datos de autenticación limpiados");
    } catch (error) {
      console.error("Error al limpiar datos de autenticación:", error);
    }
  }

  /**
   * Limpia el cache de IndexedDB
   */
  static async clearIndexedDB() {
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        indexedDB.deleteDatabase(db.name);
      }
      console.log("✓ IndexedDB limpiado");
    } catch (error) {
      console.error("Error al limpiar IndexedDB:", error);
    }
  }

  /**
   * Limpia datos de aplicación específicos
   */
  static clearAppData() {
    try {
      // Prefijos comunes de cache en aplicaciones
      const prefijos = ["app_", "cache_", "comedor_", "datos_"];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const tienePrefix = prefijos.some((prefijo) => key.startsWith(prefijo));

        if (tienePrefix) {
          localStorage.removeItem(key);
        }
      }

      // Limpiar sessionStorage similar
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && prefijos.some((prefijo) => key.startsWith(prefijo))) {
          sessionStorage.removeItem(key);
        }
      }

      console.log("✓ Datos de aplicación limpiados");
    } catch (error) {
      console.error("Error al limpiar datos de aplicación:", error);
    }
  }

  /**
   * Limpia cookies (nota: requiere acceso a document.cookie)
   */
  static clearCookies() {
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      console.log("✓ Cookies limpiadas");
    } catch (error) {
      console.error("Error al limpiar cookies:", error);
    }
  }

  /**
   * Limpia memoria de la aplicación (variables en la ventana)
   */
  static clearMemoryCache() {
    try {
      // Limpiar variables globales de cache
      if (window.__appCache__) {
        window.__appCache__ = {};
      }

      // Limpiar caches de servicios si existen
      const cachesToClear = [
        "__dataCache__",
        "__apiCache__",
        "__userCache__",
        "__menuCache__",
        "__reportCache__",
      ];

      cachesToClear.forEach((cache) => {
        if (window[cache]) {
          delete window[cache];
        }
      });

      console.log("✓ Cache de memoria limpiado");
    } catch (error) {
      console.error("Error al limpiar cache de memoria:", error);
    }
  }

  /**
   * Limpieza completa de todo el cache
   * Se ejecuta al cerrar sesión
   */
  static async clearAllCache() {
    try {
      console.log("🧹 Iniciando limpieza completa de cache...");

      // Orden de limpieza (de más específico a más general)
      this.clearAuthData();
      this.clearAppData();
      this.clearMemoryCache();
      this.clearCookies();

      // Limpieza asíncrona
      await this.clearIndexedDB();

      // Opcional: Limpiar localStorage y sessionStorage completos
      // (descomenta si necesitas una limpieza más agresiva)
      // this.clearLocalStorage();
      // this.clearSessionStorage();

      console.log("✓ Cache completamente limpiado");
      return true;
    } catch (error) {
      console.error("Error durante la limpieza de cache:", error);
      return false;
    }
  }

  /**
   * Obtiene el tamaño aproximado del cache
   */
  static getCacheSize() {
    try {
      let size = 0;

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }

      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          size += sessionStorage[key].length + key.length;
        }
      }

      return (size / 1024).toFixed(2) + " KB";
    } catch (error) {
      console.error("Error al calcular tamaño del cache:", error);
      return "No disponible";
    }
  }

  /**
   * Obtiene un reporte del cache actual
   */
  static getCacheReport() {
    return {
      localStorageItems: localStorage.length,
      sessionStorageItems: sessionStorage.length,
      cookiesCount: document.cookie.split(";").length,
      cacheSize: this.getCacheSize(),
      timestamp: new Date().toISOString(),
    };
  }
}

export default CacheService;
