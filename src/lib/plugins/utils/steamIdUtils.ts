import xml2js, {OptionsV2} from 'xml2js';
import SteamId from 'steamid';
import {SteamUserData} from '../../../types';
import got from 'got';

export function getSteamId64(userID: number | string): string {
  return SteamId.fromIndividualAccountID(userID).getSteamID64();
}

export async function getUserData(steamId64: string): Promise<SteamUserData> {
  const url = `http://steamcommunity.com/profiles/${steamId64}/?xml=1`;
  const options: OptionsV2 = {explicitArray: false, explicitRoot: false, ignoreAttrs: true, emptyTag: null};

  const serverResponse = (await got(url)).body;
  return xml2js.parseStringPromise(serverResponse, options);
}