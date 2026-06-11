import { Sequelize } from "sequelize";

const globalDb = global as typeof globalThis & { sequelize?: Sequelize };

if (!globalDb.sequelize) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  globalDb.sequelize = new Sequelize(url, {
    dialect: "mysql",
    logging: false,
  });
}

export default globalDb.sequelize!;
