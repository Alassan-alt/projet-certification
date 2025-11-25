import bcrypt from "bcrypt";
import crypto from "crypto";

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, 10);
export const comparePassword = (pwd: string, hash: string) => bcrypt.compare(pwd, hash);

export const makeInviteToken = () => {
  return crypto.randomBytes(32).toString("hex"); 
};



