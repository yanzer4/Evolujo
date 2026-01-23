const bcrypt = require('bcrypt');
const db = require('./db');

const newPassword = 'Jobretas15';
const newHash = bcrypt.hashSync(newPassword, 10);

const stmt = db.prepare('UPDATE usuarios SET password_hash = ? WHERE username IN (?, ?)');
stmt.run(newHash, 'Joice', 'Yan');

console.log('Senhas atualizadas para Jobretas15');