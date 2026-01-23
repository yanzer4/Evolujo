const Database = require('better-sqlite3');
const db = new Database('evolujo.db');

db.pragma('journal_mode = WAL');

db.exec('DELETE FROM evolucoes;');
db.exec('DELETE FROM pacientes;');
db.exec('DELETE FROM usuarios;');
db.exec('VACUUM;');

console.log('Banco de dados limpo com sucesso: evolucoes, pacientes e usuarios foram esvaziados.');

db.close();