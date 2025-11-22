const fs = require('fs');
const path = require('path');

function get_next_id(db_path) {
  if (!fs.existsSync(db_path)) {
    return 1;
  }
  const raw = fs.readFileSync(db_path, 'utf8');
  if (!raw.trim()) {
    return 1;
  }
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.length === 0) {
    return 1;
  }
  const last = data[data.length - 1].id;

  return last + 1;
}

function check_bd(db_dir, db_path) {
  if (!fs.existsSync(db_dir))
    fs.mkdirSync(db_dir,)
  if (!fs.existsSync(db_path)) {
    fs.writeFileSync(db_path, JSON.stringify({ messages: [] }, null, 2));
  }
}


module.exports = {
  get_next_id,
  check_bd
};
