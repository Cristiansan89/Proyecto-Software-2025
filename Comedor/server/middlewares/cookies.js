// Middleware para configurar cookies seguras para dominios externos (ngrok, etc)
export const cookieMiddleware = () => (req, res, next) => {
  // Función auxiliar para establecer cookies seguras
  res.setCookieSecure = (name, value, options = {}) => {
    const defaultOptions = {
      httpOnly: true,
      secure: true, // Requerido para HTTPS/ngrok
      sameSite: "none", // Requerido para dominios externos
      path: "/",
      maxAge: 8 * 60 * 60 * 1000, // 8 horas por defecto
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Si estamos en desarrollo local sin HTTPS, permitir secure: false
    if (
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_INSECURE_COOKIES === "true"
    ) {
      if (
        req.get("origin")?.includes("localhost") ||
        req.get("origin")?.includes("127.0.0.1") ||
        req.get("origin")?.includes("192.168")
      ) {
        finalOptions.secure = false;
      }
    }

    res.cookie(name, value, finalOptions);
  };

  next();
};
