const mongoose = require('mongoose');
const config = require('../config.json');


 mongoose.connect(config.MongoDB.connectionLink, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => {
  console.log("- MongoDB | Connected to database");
});
