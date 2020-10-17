import {GameData} from '../src/types';
import {Merger} from '../src/lib/utils/Merger';
import {expect} from 'chai';


const gdc1: GameData[] = [
    {
        apiVersion: 'v1',
        appId: '382890',
        platform: 'Steam',
        schema: {
            name: 'FINAL FANTASY V',
            img: {
                header: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/header.jpg',
                background: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/page_bg_generated_v6b.jpg',
                portrait: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_600x900.jpg',
                hero: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_hero.jpg',
                icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/14385c9fc1e08408c9675c7ebe51836c4cb269b3.jpg'
            },
            achievements: {
                total: 1,
                list: [
                    {
                        name: 'com.square_enix.kvin.achieve1',
                        displayName: 'FINAL FANTASY V Master',
                        hidden: 0,
                        description: 'You earned all achievements.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/a6cd3741b8021aad428bb86b13e9e1d295b3cb2d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    }
                ]
            }
        },
        stats: {sources: [], playtime: 0}
    }
]

const gdc2: GameData[] = [
    {
        apiVersion: 'v1',
        appId: '382890',
        platform: 'Steam',
        schema: {
            name: 'FINAL FANTASY V',
            img: {
                header: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/header.jpg',
                background: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/page_bg_generated_v6b.jpg',
                portrait: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_600x900.jpg',
                hero: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_hero.jpg',
                icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/14385c9fc1e08408c9675c7ebe51836c4cb269b3.jpg'
            },
            achievements: {
                total: 2,
                list: [
                    {
                        name: 'com.square_enix.kvin.achieve1',
                        displayName: 'FINAL FANTASY V Master',
                        hidden: 0,
                        description: 'You earned all achievements.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/a6cd3741b8021aad428bb86b13e9e1d295b3cb2d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    },
                    {
                        name: 'com.square_enix.kvin.achieve2',
                        displayName: 'Say Hello, Syldra!',
                        hidden: 0,
                        description: 'You obtained the pirate ship.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/12b83f0e61326e0376f5d7df6b62b87270d3450d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    }
                ]
            }
        },
        stats: {sources: [], playtime: 0}
    }
]

describe('Testing Utils', () => {
    context('Merger library', () => {
        // TODO TEST SCHEMAS COLLISION -> CHECK SCHEMAS
        it('Collision between same game schemas returns more complete schema', () => {
            Merger.mergeGameDataCollections([gdc1, gdc2]);
        });

        // TODO CHECK ACHIEVEMENTS COLLISION OLDEST

        // TODO CHECK ACHIEVEMENTS COLLISION NEWEST

        // TODO CHECK PROGRESS COLLISION
    });

    // TODO TESTS UTILS
    // TODO - PLATFORM NOT AVAILABLE

    // TODO TEST CELESDBCONNECTOR
    // TODO - INVALID API VERSION
});