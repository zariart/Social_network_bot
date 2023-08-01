export interface Config {
	Twitter: {
			Auth: {
					consumer_key: string,
					consumer_secret: string,
					access_token: string,
					access_token_secret: string
			},
	}
	Mastodon: {
			URL: string,
			AccessToken: string
	}
	KMServer: {
			URL: string
	}
}

export interface DBKaraBase {
	kid: string,
	titles: Record<string, string>,
	titles_default_language: string,
	sid: string[],
	subfile: string,
	mediafile: string,
	karafile: string,
	duration: number,
}

export interface DBKaraExtended extends DBKaraBase {
	songorder: number,
	series: DBKaraTag[],
	singers: DBKaraTag[],
	songtypes: DBKaraTag[],
	creators: DBKaraTag[],
	songwriters: DBKaraTag[],
	warnings: DBKaraTag[],
	year: number
	langs: DBKaraTag[],
	authors: DBKaraTag[],
	misc: DBKaraTag[],
	created_at: Date,
	modified_at: Date
}

export interface DBKara extends DBKaraExtended {
	seriefiles: string[],
	gain: number,
	mediasize: number,
	groups: DBKaraTag[],
	played: number,
	requested: number,
	flag_dejavu: boolean,
	lastplayed_at: Date,
	lastplayed_ago: string,
	flag_favorites: boolean,
	repo: string,
	previewfile?: string
}

export interface DBKaraTag {
	i18n: any,
	name: string,
	short: string,
	type: number,
	tid: string,
	problematic: boolean,
	noLiveDownload: boolean,
}
