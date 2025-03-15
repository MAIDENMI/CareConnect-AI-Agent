import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://careconnect.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "stsa4EwSK3Nv",
  fields: {
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "WRSsenasc1J6",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "8AkkrbVzNezO",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "YE7nAKKtmL-k",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "GZ_R7RNfN3W0",
    },
    firstName: { type: "string", storageKey: "F-bWjiAZSV8z" },
    googleImageUrl: { type: "url", storageKey: "YKu0wzt4ok41" },
    googleProfileId: { type: "string", storageKey: "lG1C_sq1RIhX" },
    lastName: { type: "string", storageKey: "o-RgGepFVUMx" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "OUK2iTpkvBhO",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "BVK93S3hif_8",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "AioJwItRhqKs",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "yBActm2hRvv7",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "kJK3sLj7B67N",
    },
  },
};
