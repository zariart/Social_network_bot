import {readFileSync, writeFileSync} from 'fs';
import {dump, load} from 'js-yaml';
import {Config, DBKara} from './types';
import got from 'got';
import sample from 'lodash.sample';
import TwitterApi from 'twitter-api-v2';
import { login } from 'masto';

// Flags
const flags = {
	fre: '🇫🇷',
	jpn: '🇯🇵',
	eng: '🇬🇧',
	ita: '🇮🇹',
	zxx: '🎶',
	mul: '🌍',
	ger: '🇩🇪',
	kor: '🇰🇷',
	lat: '🇻🇦',
	rus: '🇷🇺',
	chi: '🇨🇳',
	spa: '🇪🇸',
	epo: 'Espéranto',
	swe: '🇸🇪',
	ara: '🇦🇪',
	bre: 'Breton',
	fin: '🇫🇮',
	gle: '🇮🇪',
	heb: '🇮🇱',
	por: '🇵🇹',
	tel: '🇮🇳',
	tha: '🇹🇭',
	vie: '🇻🇳',
	dut: '🇳🇱',
	und: '⚐'
};

const tagTypes = [
	'series',
	'singers',
	'songtypes',
	'creators',
	'langs',
	'authors',
	'misc',
	'songwriters',
	'groups',
	'families',
	'origins',
	'genres',
	'platforms',
	'collections',
	'warnings',
	'versions',
	'singergroups',
	'collections',
	'franchises',
];


async function main() {
	// First, read config file
	console.log('Reading configuration');
	const configFile = readFileSync('config.yml', 'utf8');
	const config: Config  = load(configFile) as Config;
	// Open posted KIDs list
	console.log('Reading posted files');
	let posted = {};
	try {
		const postedFile = readFileSync('posted.yml', 'utf8');
		posted = load(postedFile);
	} catch(err) {
		// Do nothing, it's ignored.
	}
	console.log('Getting Karas');
	// Fetch all karas from KM Server
	const res = await got.get(`${config.KMServer.URL}/api/karas/search`);
	// Filter R18 and non MP4 files as well as already posted songs
	const i18n = JSON.parse(res.body).i18n;
	const karas = JSON.parse(res.body).content
		.filter((k: DBKara) => k.mediafile.endsWith('.mp4'))
		.filter((k: DBKara) => !Object.keys(posted).includes(k.kid))
		.filter((k: DBKara) => {
			let exclude = false;
			for (const tagType of tagTypes) {
				if (k[tagType]) exclude = k[tagType].some((t: any) => t.problematic || t.noLiveDownload);
				if (exclude) break;
			}
			return !exclude;
		});
	console.log(`Found ${karas.length} eligible songs`);
	// Select a random song
	const karaSample: DBKara = sample(karas);
	// Fetch info
	const kara = {
		titles: karaSample.titles[karaSample.titles_default_language],
		series: karaSample.series[0]
			? i18n[karaSample.series[0].tid]?.eng || karaSample.series[0]?.name
			: null,
		singer: karaSample.singers.map(s => s.name).join(', '),
		singergroup: karaSample.singergroups.map(s => s.name).join(', ')
		songwriter: karaSample.songwriters.map(s => s.name).join(', '),
		order: karaSample.songorder,
		type: i18n[karaSample.songtypes[0].tid].eng,
		lang: flags[karaSample.langs[0].name],
		url: `https://kara.moe/kara/${karaSample.kid}`
	};
	console.log('Selected song :');
	console.log(kara);
	// Build status
	const text = [];
	if (kara.series) text.push(`🎥 : ${kara.series}`);
	text.push(`👁 : ${kara.type} ${kara.order || ''} ${kara.lang || ''}`);
	text.push(`🔉 : ${kara.titles}`);
	if (kara.singergroup) {
		text.push(`🎤 : ${kara.singergroup}`);
	} else (kara.singer) {
		text.push(`🎤 : ${kara.singer}`);
	}
	if (kara.songwriter) text.push(`🎹 : ${kara.songwriter}`);
	text.push('');
	text.push(`▶️ : ${kara.url}`);
	text.push('#️⃣ : #Karaoke #KaraokeMugen');
	console.log('Status to be posted : ');
	console.log(text);
	// Twitter part
	console.log('Logging into Twitter');
	const twitter = new TwitterApi({
		appKey: config.Twitter.Auth.consumer_key,
		appSecret: config.Twitter.Auth.consumer_secret,
		accessToken: config.Twitter.Auth.access_token,
		accessSecret: config.Twitter.Auth.access_token_secret
	});

	const status = {
		status: text.join('\n')
	};

	// Make tweet
	console.log('Making tweet');
	console.log('AppLogin');
	await twitter.appLogin();
	console.log('Posting');
	await twitter.v2.tweet(status.status);
	// Mastodon part
	console.log('Logging into Mastodon');
	const toot = await login({
		url: config.Mastodon.URL,
		accessToken: config.Mastodon.AccessToken
	});

	console.log('Creating status');
	await toot.v1.statuses.create({
		status: text.join('\n'),
		visibility: 'public'
	});

	console.log('Writing to posted.yml');
	// Write our posted KID and date to a file
	posted[karaSample.kid] = new Date().toString();
	writeFileSync('posted.yml', dump(posted), 'utf8');
	// All done!

}

main().catch(err => console.log(err));
