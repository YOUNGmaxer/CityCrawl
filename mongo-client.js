const { MongoClient } = require('mongodb');

class DbManager {
  constructor(MONGO_URL, MONGO_DB) {
    this.MONGO_URL = MONGO_URL;
    this.MONGO_DB = MONGO_DB;
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = await MongoClient.connect(this.MONGO_URL);
    this.db = this.client.db(this.MONGO_DB);
  }

  async insert(name, doc) {
    await this.connect();
    const collection = await this.db.collection(name);
    collection.insertOne(doc);
  }

  async close() {
    this.client.close();
  }
}

module.exports = DbManager;