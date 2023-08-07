import { Pretrust } from "../../types";
import { getDB } from "../../utils";

export type PretrustStrategy = () => Promise<Pretrust<string>>;

const db = getDB();

const pretrustAllEqually: PretrustStrategy = async () => {
  return [];
};

const pretrustFirstFifty: PretrustStrategy = async () => {
  const ids = await db("k3l_profiles")
    .select("profile_id")
    .orderBy("profile_id", "asc")
    .limit(50);
  const pretrust: Pretrust<string> = [];

  ids.forEach(({ profileId }: { profileId: string }) => {
    pretrust.push({
      i: profileId,
      v: 1 / ids.length,
    });
  });

  return pretrust;
};

const pretrustOGs: PretrustStrategy = async () => {
  const ogs = [
    "orbapp.lens",
    "nilesh.lens",
    "kipto.lens",
    "sankalpk.lens",
    "stani.lens",
  ];

  const ids = await db("k3l_profiles")
    .select("profile_id")
    .whereIn("handle", ogs);
  const pretrust: Pretrust<string> = [];

  ids.forEach(({ profileId }: { profileId: string }) => {
    pretrust.push({
      i: profileId,
      v: 1 / ids.length,
    });
  });

  return pretrust;
};

export const strategies: Record<string, PretrustStrategy> = {
  pretrustOGs,
  pretrustFirstFifty,
  pretrustAllEqually,
};
