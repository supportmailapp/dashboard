import { mongoUri } from "$env/static/private";
import { MongoClient } from "mongodb";

class MongoDB {
  private client: MongoClient;

  constructor() {
    this.client = new MongoClient(mongoUri);
  }

  // connect to the database
  public async connect() {
    await this.client.connect();
  }

  // disconnect from the database
  public async disconnect() {
    await this.client.close();
  }

  // get the database
  public getDB() {
    return this.client.db();
  }
}

const mongoDB = new MongoDB();

export { mongoDB };
