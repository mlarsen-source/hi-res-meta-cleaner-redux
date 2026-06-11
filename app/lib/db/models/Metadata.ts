import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../sequelize";

export class Metadata extends Model<InferAttributes<Metadata>, InferCreationAttributes<Metadata>> {
  declare metadata_id: CreationOptional<number>;
  declare file_id: number;
  declare title: string | null;
  declare artist: string | null;
  declare album: string | null;
  declare year: number | null;
  declare genre: string | null;
  declare track: number | null;
  declare comment: string | null;
  declare album_artist: string | null;
  declare composer: string | null;
  declare discnumber: number | null;
  declare type: string | null;
  declare size: string | null;
}

Metadata.init(
  {
    metadata_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    file_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: true },
    artist: { type: DataTypes.STRING(255), allowNull: true },
    album: { type: DataTypes.STRING(255), allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: true },
    genre: { type: DataTypes.STRING(100), allowNull: true },
    track: { type: DataTypes.INTEGER, allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
    album_artist: { type: DataTypes.STRING(255), allowNull: true },
    composer: { type: DataTypes.STRING(255), allowNull: true },
    discnumber: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.STRING(50), allowNull: true },
    size: { type: DataTypes.STRING(50), allowNull: true },
  },
  { sequelize, tableName: "metadata", timestamps: false }
);
