const fs = require('fs');
const path = require('path');

function get_next_id(db_path) {
  if (!fs.existsSync(db_path)) {
    return 1;
  }
  const raw = fs.readFileSync(db_path, 'utf8');
  if (!raw.trim() || raw.trim() === '[]') {
    return 1;
  }
  
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) {
      return 1;
    }

    const maxId = data.reduce((max, obj) => {
        const currentId = obj.id || 0; 
        return currentId > max ? currentId : max;
    }, 0); 
    
    return maxId + 1;

  } catch (e) {
    console.error("Erro ao fazer parse do DB, resetando ID count.");
    return 1;
  }
}

function check_bd(db_dir, db_path) {
  if (!fs.existsSync(db_dir))
    fs.mkdirSync(db_dir, { recursive: true });
    
  if (!fs.existsSync(db_path)) {
    fs.writeFileSync(db_path, '[]');
  }
}

module.exports = {
  get_next_id,
  check_bd
};
