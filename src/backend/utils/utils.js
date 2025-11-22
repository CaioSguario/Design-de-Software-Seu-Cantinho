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

module.exports = {
  get_next_id
};
