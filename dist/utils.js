"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInviteToken = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (pwd) => bcrypt_1.default.hash(pwd, 10);
exports.hashPassword = hashPassword;
const comparePassword = (pwd, hash) => bcrypt_1.default.compare(pwd, hash);
exports.comparePassword = comparePassword;
const makeInviteToken = () => {
    return crypto_1.default.randomBytes(32).toString("hex");
};
exports.makeInviteToken = makeInviteToken;
