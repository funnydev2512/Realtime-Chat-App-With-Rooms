var axios = require('axios');
require('dotenv').config();

function harperSaveMessage(message, username, room) {
  const dbUrl = process.env.HARPERDB_URL;
  const dbPw = process.env.HARPERDB_PW;
  if (!dbUrl || !dbPw) return null;

  var data = JSON.stringify({
    operation: 'insert',
    schema: 'realtime_chat_app',
    table: 'messages',
    records: [
      {
        message,
        username,
        room,
      },
    ],
  });

  var config = {
    method: 'post',
    url: dbUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: dbPw,
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios(config)
      .then(function (response) {
        resolve(JSON.stringify(response.data));
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function harperGetMessages(room) {
    const dbUrl = process.env.HARPERDB_URL;
    const dbPw = process.env.HARPERDB_PW;
    if (!dbUrl || !dbPw) return null;
  
    let data = JSON.stringify({
      operation: 'sql',
      sql: `SELECT * FROM realtime_chat_app.messages WHERE room = '${room}' LIMIT 100`,
    });
  
    let config = {
      method: 'post',
      url: dbUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: dbPw,
      },
      data: data,
    };
  
    return new Promise((resolve, reject) => {
      axios(config)
        .then(function (response) {
          resolve(JSON.stringify(response.data));
        })
        .catch(function (error) {
          reject(error);
        });
    });
  }
  
module.exports = {harperSaveMessage, harperGetMessages};