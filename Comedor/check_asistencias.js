import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'comedor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkData() {
  const connection = await pool.getConnection();
  
  try {
    // Verificar cantidad de asistencias
    const [asistencias] = await connection.query('SELECT COUNT(*) as total FROM Asistencias');
    console.log('📊 Total de registros en Asistencias:', asistencias[0].total);
    
    // Ver últimos 5 registros
    const [ultimos] = await connection.query(`
      SELECT 
        a.id_asistencia,
        a.fecha,
        s.nombre as servicio,
        g.nombreGrado,
        a.tipoAsistencia,
        a.estado
      FROM Asistencias a
      LEFT JOIN Servicios s ON a.id_servicio = s.id_servicio
      LEFT JOIN AlumnoGrado ag ON a.id_alumnoGrado = ag.id_alumnoGrado
      LEFT JOIN Grados g ON ag.nombreGrado = g.nombreGrado
      ORDER BY a.fecha DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Últimos 5 registros de asistencia:');
    console.table(ultimos);
    
    // Ver fechas disponibles
    const [fechas] = await connection.query(`
      SELECT DISTINCT DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha, COUNT(*) as cantidad
      FROM Asistencias a
      GROUP BY DATE_FORMAT(a.fecha, '%Y-%m-%d')
      ORDER BY a.fecha DESC
      LIMIT 10
    `);
    
    console.log('\n📅 Fechas con registros de asistencia:');
    console.table(fechas);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

checkData();
