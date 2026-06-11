import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../sequelize";

export class AudioFile extends Model<
  InferAttributes<AudioFile>,
  InferCreationAttributes<AudioFile>
> {
  declare file_id: CreationOptional<number>;
  declare user_id: number;
  declare filename: string;
  declare original_filename: string;
  declare upload_date: CreationOptional<Date>;
}

AudioFile.init(
  {
    file_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    original_filename: { type: DataTypes.STRING(255), allowNull: false },
    upload_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: "audio_files", timestamps: false }
);
