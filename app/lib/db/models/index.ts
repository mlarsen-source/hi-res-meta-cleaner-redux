import { AudioFile } from "./AudioFile";
import { Metadata } from "./Metadata";
import { User } from "./User";

AudioFile.hasOne(Metadata, { foreignKey: "file_id" });
Metadata.belongsTo(AudioFile, { foreignKey: "file_id" });

export { User, AudioFile, Metadata };
