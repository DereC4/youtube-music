const { ipcRenderer } = require("electron");
const is = require("electron-is");

module.exports = (options) => {
	ipcRenderer.on("update-song-info", (_, extractedSongInfo) => setTimeout(() => {
		const tabList = document.querySelectorAll("tp-yt-paper-tab");
		const tabs = {
			upNext: tabList[0],
			lyrics: tabList[1],
			discover: tabList[2],
		}

		/* 
		Check if disabled
		If translation options are enabled, it'll skip this check to prevent the native Youtube lyric finder overriding the
		lyrics tab. 
		*/
		if (!tabs.lyrics?.hasAttribute("disabled") && !options.romanizedLyrics) {
			return;
		}

		let hasLyrics = true;

		const lyrics = ipcRenderer.sendSync(
			"search-genius-lyrics",
			extractedSongInfo
		);
		if (!lyrics) {
			// Delete previous lyrics if tab is open and couldn't get new lyrics
			checkLyricsContainer(() => {
				hasLyrics = false;
				setTabsOnclick(undefined);
			});
			console.log("Lyrics already exist");
			return;
		}

		if (is.dev()) {
			console.log("Fetched lyrics from Genius");
		}

		enableLyricsTab();

		setTabsOnclick(enableLyricsTab);

		checkLyricsContainer();

		tabs.lyrics.onclick = () => {
			const tabContainer = document.querySelector("ytmusic-tab-renderer");
			const observer = new MutationObserver((_, observer) => {
				checkLyricsContainer(() => observer.disconnect());
			});
			observer.observe(tabContainer, {
				attributes: true,
				childList: true,
				subtree: true,
			});
		};

		function checkLyricsContainer(callback = () => {}) {
			console.log("End1");
			const lyricsContainer = document.querySelector(
				'[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"] > ytmusic-message-renderer'
			);
			const songTypeContainer = document.querySelector('#contents .non-expandable.ytmusic-description-shelf-renderer');			
			console.log(lyricsContainer2.innerHTML);

			if (lyricsContainer) {
				console.log("End2");
				callback();
				setLyrics(lyricsContainer)
			}
		}

		/*
		Set the "Lyrics" tab you see on screen by injecting lyrics into the HTML. 
		*/
		function setLyrics(lyricsContainer) {
			// Appears to be rendered only when the song is not a "Song" type.
			lyricsContainer.innerHTML = `<div id="contents" class="style-scope ytmusic-section-list-renderer description ytmusic-description-shelf-renderer genius-lyrics">
			 		${
						hasLyrics ? lyrics.replace(/(?:\r\n|\r|\n)/g, "<br/>") : "Could not retrieve lyrics from genius"
					}
				</div>
				<yt-formatted-string class="footer style-scope ytmusic-description-shelf-renderer" style="align-self: baseline"></yt-formatted-string>`;
			if (hasLyrics) {
				lyricsContainer.querySelector('.footer').textContent = 'Source: Genius';
				enableLyricsTab();
			}
			console.log("End");

		}

		function setTabsOnclick(callback) {
			for (const tab of [tabs.upNext, tabs.discover]) {
				if (tab) {
					tab.onclick = callback;
				}
			}
		}

		function enableLyricsTab() {
			tabs.lyrics.removeAttribute("disabled");
			tabs.lyrics.removeAttribute("aria-disabled");
		}
	}, 500));
};
