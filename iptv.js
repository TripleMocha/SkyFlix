import "https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.6/shaka-player.compiled.js";

const channelContainer = document.getElementById("channel-container");
const searchInput = document.getElementById("searchInput");
const video = document.getElementById("video");

let shakaPlayer = new shaka.Player(video);
let hlsPlayer = null;
let currentActiveCard = null;

// Install Shaka polyfills
shaka.polyfill.installAll();

// Video styling
video.style.width = "100%";
video.style.height = "500px";

// Toast helper
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "5px",
      zIndex: "9999",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      opacity: "0",
      transition: "opacity 0.3s",
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => (toast.style.opacity = "0"), 3000);
}

// Detect type
function getChannelType(channel) {
  if (channel.stream.endsWith(".m3u8")) return "HLS";
  if (channel.stream.endsWith(".mpd")) {
    if (!channel.drm) return "DASH";
    if (typeof channel.drm === "string") return "DASH_DRM_STRING";
    if (typeof channel.drm === "object") return "DASH_DRM_KEYS";
  }
  return "UNKNOWN";
}

// Play channel
async function playChannel(channel) {
  const type = getChannelType(channel);
  try {
    if (hlsPlayer) {
      hlsPlayer.destroy();
      hlsPlayer = null;
    }

    if (type === "HLS") {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = channel.stream;
        await video.play();
      } else {
        if (!window.Hls) await import("https://cdn.jsdelivr.net/npm/hls.js@latest");
        hlsPlayer = new Hls();
        hlsPlayer.loadSource(channel.stream);
        hlsPlayer.attachMedia(video);
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      }
      showToast(`Playing ${channel.name} (HLS)`);
    } else if (type === "DASH") {
      shakaPlayer.configure({ drm: {} });
      await shakaPlayer.load(channel.stream);
      showToast(`Playing ${channel.name} (DASH)`);
    } else if (type === "DASH_DRM_STRING") {
      const licenseServerUrl = `data:application/octet-stream;base64,${channel.drm}`;
      shakaPlayer.configure({
        drm: { servers: { 'com.widevine.alpha': licenseServerUrl } },
      });
      await shakaPlayer.load(channel.stream);
      showToast(`Playing ${channel.name} (DASH + DRM)`);
    } else if (type === "DASH_DRM_KEYS") {
      shakaPlayer.configure({
        drm: { clearKeys: { [channel.drm.keyId]: channel.drm.key } },
      });
      await shakaPlayer.load(channel.stream);
      showToast(`Playing ${channel.name} (DASH + DRM Keys)`);
    } else {
      showToast(`Cannot play ${channel.name}: unknown stream type`);
    }
  } catch (err) {
    console.error(err);
    showToast(`Failed to play ${channel.name}`);
  }
}

// Load channels
function loadChannels(channels) {
  channelContainer.innerHTML = "";

   const style = document.createElement("style");
  style.innerHTML = `
    /* ===== Player and Channel Container ===== */
    #video {
      width: 100%;
      height: 700px;
      margin-top: 50px; /* ✅ Add spacing from top */
      display: block;
    }

    #channel-container {
      display: flex;
      flex-wrap: wrap;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 400px;
      justify-content: flex-start;
      padding: 0;
      margin: 50px 0 0 0; /* ✅ Added margin-top for spacing */
    }

    /* ===== Channel Card Design ===== */
    .channel-card {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 250px;
      height: 60px;
      background-color: #fff;
      border: 1px solid #ddd;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: 'Poppins', sans-serif;
      box-sizing: border-box;
      margin: 0; /* No spacing between cards */
      border-radius: 0;
    }

    .channel-card:hover {
      background-color: #f9f9f9;
    }

    .channel-card.active {
      background-color: #e9f3ff;
      border: 2px solid #007bff;
    }

    .channel-logo {
      width: 45px;
      height: 45px;
      object-fit: contain;
      margin-left: 8px;
      margin-right: 12px;
      background-color: #fff;
    }

    .channel-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);

  channels.forEach((ch) => {
    const card = document.createElement("div");
    card.className = "channel-card";
    card.innerHTML = `
      <img class="channel-logo" src="${ch.logo}" alt="${ch.name}" />
      <div class="channel-name">${ch.name}</div>
    `;
    card.onclick = () => {
      currentActiveCard?.classList.remove("active");
      card.classList.add("active");
      currentActiveCard = card;
      playChannel(ch);
    };
    channelContainer.appendChild(card);
  });
}

// Search filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = channels.filter(
    ch =>
      ch.name.toLowerCase().includes(query) ||
      (ch.genre && ch.genre.toLowerCase().includes(query))
  );
  loadChannels(filtered);
});

const channels = [
   { name: "KAPAMILYA CHANNEL", genre: "General Entertainment", logo: "../assets/img/channel logo/Kapamilya Channel Logo.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-kapcha-dash-abscbnono/index.mpd", drm: "YmQxN2FmYjVkYzk2NDhhMzliZTc5ZWUzNjM0ZGQ0Yjg6M2VjZjMwNWQ1NGE3NzI5Mjk5YjkzYTNkNjljMDJlYTU=" },
  { name: "GMA PINOY TV", genre: "General Entertainment", logo: "../assets/img/channel logo/GMA_Life_TV.png", stream: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-abscbn-gma-x7-dash-abscbnono/7c693236-e0c1-40a3-8bd0-bb25e43f5bfc/index.mpd" },
  { name: "TV 5", genre: "General Entertainment", 
    logo: "../assets/img/channel logo/TV5.png", 
    stream: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/tv5_hd/default1/index.mpd',
    drm: {
      keyId: '2615129ef2c846a9bbd43a641c7303ef',
      key: '07c7f996b1734ea288641a68e1cfdc4d'
    }
  },
  { name: "A2Z", genre: "General Entertainment", logo: "../assets/img/channel logo/a2z.png", stream: "https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_a2z.mpd", drm: "ZjcwM2U0YzhlYzkwNDFlZWI1MDI4YWI0MjQ4ZmEwOTQ6YzIyZjIxNjJlMTc2ZWVlNjI3M2E1ZDBiNjhkMTk1MzA=" },
  
  { name: "DZMM TELERADYO", genre: "News and Information", logo: "../assets/img/channel logo/DZMM_TeleRadyo.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-teleradyo-dash-abscbnono/index.mpd", drm: "NDdjMDkzZTBjOWZkNGY4MDgzOWEwMzM3ZGEzZGQ4NzY6NTA1NDczOTQwNDViM2QwNDdkYzdkOTJmNTdiNWZiMzM=" },
  { name: "TFC", genre: "General Entertainment", logo: "../assets/img/channel logo/tfc.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-tfcasia-dash-abscbnono/index.mpd", drm: "OTU2OGNjODRlMWQ5NDRmMzhlYWMzMDQ1MTdlYWI2ZmQ6ZjEyMTQyYWY4ZjM5YjNiYWI3OWQzNjc5ZDM2NjVlYmU=" }, 
  { name: "ANC HD", genre: "News and Information", logo: "../assets/img/channel logo/ANC_HD.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-anc-global-dash-abscbnono/index.mpd", drm: "NGJiZGM3ODAyNGE1NDY2Mjg1NGI0MTJkMDFmYWZhMTY6NjAzOWVjOWIyMTNhY2E5MTM4MjE2NzdhMjhiZDc4YWU=" },
   { name: "MYX", genre: "Music", logo: "../assets/img/channel logo/Myx.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-myxnola-dash-abscbnono/index.mpd", drm: "ZjQwYTUyYTNhYzliNDcwMmJkZDViNzM1ZDkxMGZkMmY6NWNlMWJjN2YwNmI0OTRjMjc2MjUyYjRkMTNjOTBlNTE=" },
  { name: "CINEMO", genre: "Movies", logo: "../assets/img/channel logo/CINEMO.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-cinemo-dash-abscbnono/index.mpd", drm: "YWE4YWViZTM1Y2NjNDU0MWI3Y2U2MjkyZWZjYjFiZmI6YWFiMWRmMTA5ZDIyZmM1ZDdlM2VjMTIxZGRmMjRlNWY=" },
  { name: "CINEMA ONE", genre: "Movies", logo: "../assets/img/channel logo/cinema_one.png", stream: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01006-abs-cbn-cinemaone-dash-abscbnono/index.mpd", drm: "NThkMGU1Njk5MTE5NDA0M2I4ZmI4MmZlYjRkYjcyNzY6ZDY4ZjQxYjU5NjQ5Njc2Nzg4ODg5ZTE5ZmIxMGQyMmM=" },
  { name: "VIVA CINEMA", genre: "Movies", logo: "../assets/img/channel logo/vivacinema.png", stream: "https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/viva_sd.mpd", drm: "MDdhYTgxM2JmMmMxNDc3NDgwNDZlZGQ5MzBmNzczNmU6M2JkNjY4OGI4YjQ0ZTk2MjAxZTc1MzIyNGFkZmM4ZmI=" },
  {
   name: 'Sinemanila',
    logo: '../assets/img/channel logo/cinemanila.png',
    genre: "Movies",
    stream: 'https://live20.bozztv.com/giatv/giatv-sinemanila/sinemanila/playlist.m3u8',
    },
     {
   name: 'Hallypop',
    logo: '../assets/img/channel logo/hallypop.png',
    genre: "Movies",
    stream: 'https://jungotvstream.chanall.tv/jungotv/hallypop/playlist_1080p.m3u8',
    },
  {
   name: 'TVUP',
    genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/TVUP.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/tvup_prd.mpd',
    drm: {
      keyId: '83e813ccd4ca4837afd611037af02f63',
      key: 'a97c515dbcb5dcbc432bbd09d15afd41'
    }
  },
  {
   name: 'RPTV',
    genre: "General Entertainment",
    logo: '../assets/img/channel logo/rptv.png',
    stream: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cnn_rptv_prod_hd.mpd',
    drm: {
      keyId: '1917f4caf2364e6d9b1507326a85ead6',
      key: 'a1340a251a5aa63a9b0ea5d9d7f67595'
    }
  },
   {
   name: 'PTV',
    genre: "News and Information",
    logo: '../assets/img/channel logo/ptv.png',
    stream: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_ptv4_sd.mpd',
    drm: {
      keyId: '71a130a851b9484bb47141c8966fb4a3',
      key: 'ad1f003b4f0b31b75ea4593844435600'
    }
  },
   {
   name: 'MPTV',
    genre: "News and Information",
    logo: '../assets/img/channel logo/mptv.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/cg_mptv.mpd',
    drm: {
      keyId: '6aab8f40536f4ea98e7c97b8f3aa7d4e',
      key: '139aa5a55ade471faaddacc4f4de8807'
    }
  },
  {
   name: 'True FM TV',
    genre: "News and Information",
    logo: '../assets/img/channel logo/TRUE FM.png',
    stream: 'https://qp-pldt-live-grp-08-prod.akamaized.net/out/u/truefm_tv.mpd',
    drm: {
      keyId: '0559c95496d44fadb94105b9176c3579',
      key: '40d8bb2a46ffd03540e0c6210ece57ce'
    }
  },
 
  { name: "NBA TV", genre: "Sports", logo: "../assets/img/channel logo/nba-tv.png", stream: 'https://ottb.live.cf.ww.aiv-cdn.net.../v1/066dd9325648468c9ecdc8b272370931/cenc.mpd',
    drm: {
      keyId: '84077d18bcf234a42de3745be106a87f',
      key: 'aee3069c062ec8ee6bfdd32985f287ef'
    }
  },
  {
        name: 'WWE',
        genre: "Sports",
        logo: 'https://mcdn.wallpapersafari.com/medium/43/73/OC5BrI.png',
        stream: 'https://fsly.stream.peacocktv.com/Content/CMAF_CTR-4s/Live/channel(vc106wh3yw)/master.mpd',
    drm: {
      keyId: '00208c93f4358213b52220898b962385',
      key: '8ae6063167228e350dd132d4a1573102'
    }
      },
  {
   name: 'NBA TV Philippines',
    genre: "Sports",
    logo: '../assets/img/channel logo/nba-tv-philippines.png',
    stream: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cgnl_nba/default/index.mpd',
    drm: {
      keyId: 'c5e51f41ceac48709d0bdcd9c13a4d88',
      key: '20b91609967e472c27040716ef6a8b9a'
    }
  },
  { name: 'ONE PH', genre: "General Entertainment", logo: "../assets/img/channel logo/One-PH.png", stream: 'https://qp-pldt-live-grp-04-prod.akamaized.net/out/u/oneph_sd.mpd', drm:"OTI4MzRhYjRhN2UxNDk5YjkwODg2YzVkNDkyMjBlNDY6YTcxMDhkOWE2Y2ZjYzFiNzkzOWViMTExZGFmMDlhYjM=" },
  { name: 'ONE SPORTS', genre: "Sports", logo: "../assets/img/channel logo/TV5_One_Sports.png", stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/cg_onesports_hd.mpd', drm:"NTNjM2JmMmViYTU3NGY2MzlhYTIxZjJkNDQwOWZmMTE6M2RlMjg0MTFjZjA4YTY0ZWE5MzViOTU3OGY2ZDBlZGQ=" },
  { name: 'ONE SPORTS+', genre: "Sports", logo: "../assets/img/channel logo/one-sports-plus.png", stream: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_onesportsplus_hd1.mpd', drm:"MzIyZDA2ZTkzMjZmNDc1M2E3ZWMwOTA4MDMwYzEzZDg6MWUzZTBjYTMyZDQyMWZiZmVjODZmZWNlZDBlZmVmZGE="},
  { name: "PBA RUSH", genre: "Sports", logo: "../assets/img/channel logo/pba_rush.jpg", 
    stream: 'https://qp-pldt-live-bpk-02-prod.akamaized.net/bpk-tv/cg_pbarush_hd1/default/index.mpd',
    drm: {
      keyId: '76dc29dd87a244aeab9e8b7c5da1e5f3',
      key: '95b2f2ffd4e14073620506213b62ac82'
    }
  }, 
  {
   name: 'UAAP',
     genre: "Sports",
    logo: '../assets/img/channel logo/UAAP.png',
    stream: 'https://qp-pldt-live-grp-04-prod.akamaized.net/out/u/cg_uaap_cplay_sd.mpd',
    drm: {
      keyId: '95588338ee37423e99358a6d431324b9',
      key: '6e0f50a12f36599a55073868f814e81e'
    }
  },
  
      {
   name: 'CNN HD',
    genre: "News and Information",
    logo: '../assets/img/channel logo/cnn.png',
    stream: 'https://qp-pldt-live-grp-12-prod.akamaized.net/out/u/dr_cnnhd.mpd',
drm: {
      keyId: '900c43f0e02742dd854148b7a75abbec',
      key: 'da315cca7f2902b4de23199718ed7e90'
    }
  },
  {
   name: 'TSN+',
    genre: "Sports",
    logo: '../assets/img/channel logo/tsn-plus.png',
    stream: 'https://live-ds.video.9c9media.com/...64a441751741056621/f/tsndigi0701/manifest.mpd',
    drm: {
      keyId: 'b32629202555405caaf2880c3bbb77dc',
      key: 'af8cdbfab978b35f920cecb1e53c7546'
    }
  },
  {
   name: 'SPOTV 1',
    genre: "Sports",
    logo: '../assets/img/channel logo/spotv.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_spotvhd.mpd',
    drm: {
      keyId: 'ec7ee27d83764e4b845c48cca31c8eef',
      key: '9c0e4191203fccb0fde34ee29999129e'
    }
  },
  {
   name: 'SPOTV 2',
    genre: "Sports",
    logo: '../assets/img/channel logo/spotv2.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_spotv2hd.mpd',
    drm: {
      keyId: '7eea72d6075245a99ee3255603d58853',
      key: '6848ef60575579bf4d415db1032153ed'
    }
  },
   {
   name: 'PREMIER TENNIS 1',
     genre: "Sports",
    logo: '../assets/img/channel logo/premiertennis1.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_premiertennishd.mpd',
    drm: {
      keyId: '59454adb530b4e0784eae62735f9d850',
      key: '61100d0b8c4dd13e4eb8b4851ba192cc'
    }
  },
  {
   name: 'PREMIER SPORTS HD',
    genre: "Sports",
    logo: '../assets/img/channel logo/Premier-Sports-2.png',
    stream: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_ps_hd1.mpd',
    drm: {
      keyId: 'b8b595299fdf41c1a3481fddeb0b55e4',
      key: 'cd2b4ad0eb286239a4a022e6ca5fd007'
    }
  },
    {
   name: 'Premier League',
    genre: "Sports",
    logo: 'https://logos-world.net/wp-content/uploads/2023/02/Premier-League-Logo-2007.png',
    stream: 'https://fsly.stream.peacocktv.com/Content/CMAF_CTR-4s/Live/channel(vc1021n07j)/master.mpd',
    drm: {
      keyId: '002046c9a49b9ab1cdb6616bec5d26c3',
      key: 'd2f92f6b7edc9a1a05d393ba0c20ef9e'
    }
  },
   {
   name: 'NBC Sports',
    genre: "Sports",
    logo: 'https://i.ibb.co/PN0fjNF/90-removebg-preview.png',
    stream: 'https://fsly.stream.peacocktv.com/Content/CMAF_CTR-4s/Live/channel(vc122ycnuy)/master.mpd',
    drm: {
      keyId: '0020d88a6713159839743f655c5da7de',
      key: 'ba9f34226301f69a4f0f13f65a1f92ec'
    }
  },

  
{
   name: 'ANIPLUS',
    logo: '../assets/img/channel logo/aniplus.png',
    genre: "Kids",
    stream: 'https://proxy.nathcreqtives.com/api/stream/aniplus/manifest.mpd',
    drm: {
      keyId: 'f2c313fce55344e5a52389741d1f53f8',
      key: 'bae1e47db562b66895beb8fccdf2ad8a'
    }
  },
  {
   name: 'ANIMAX',
    logo: '../assets/img/channel logo/animax.jpg',
    genre: "Kids",
    stream: 'https://tglmp01.akamaized.net/out/v1/de55fad9216e4fe7ad8d2eed456ba1ec/manifest.mpd',
    drm: {
      keyId: 'edf1a715de9748638dd2fad75a419af2',
      key: '2f5a3199b26e9b693ae881af7ff864cf'
    }
  },
  {
   name: 'Anime X Hidive',
    logo: '../assets/img/channel logo/AnimeXHIDIVE.png',
    genre: "Kids",
    stream: 'https://amc-anime-x-hidive-1-us.tablo.wurl.tv/playlist.m3u8',
    },
   {
   name: 'AnimeX',
    logo: '../assets/img/channel logo/animeX.png',
    genre: "Kids",
    stream: 'https://live20.bozztv.com/giatv/giatv-animex/animex/playlist.m3u8',
    },
  { name: 'PBS KIDS', genre: "Kids", 
   logo: "../assets/img/channel logo/PBS-Kids.png", 
   genre: "Kids", 
   stream: 'https://2-fss-2.streamhoster.com/pl_140/amlst:200914-1298290/chunklist_b2000000.m3u8' },
  { name: 'PBO', genre: "Movies", logo: "../assets/img/channel logo/PBO.png", stream: 'https://qp-pldt-live-grp-04-prod.akamaized.net/out/u/pbo_sd.mpd',drm:"ZGNiZGFhYTY2NjJkNDE4OGJkZjk3ZjlmMGNhNWU4MzA6MzFlNzUyYjQ0MWJkMjk3MmYyYjk4YTRiMWJjMWM3YTE=" },  
  { name: "ANIMAL PLANET", genre: "Education & Documentary", logo: "../assets/img/channel logo/Animal-Planet.png", stream: "https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_animal_planet_sd.mpd", drm: "NDM2YjY5Zjk4NzkyNGZjYmJjMDZkNDBhNjljMjc5OWE6YzYzZDViMGQ3ZTUyMzM1YjYxYWViYTRmNjUzN2Q1NGQ=" },
  {
    name: "National Geographic",
    stream: 'https://proxy.nathcreqtives.com/api/channel/national-geographic/manifest.m3u8',
    genre: "Education & Documentary",
    logo: '../assets/img/channel logo/natgeo.png',
}, {
    name: "Nat Geo Wild",
    stream: 'https://proxy.nathcreqtives.com/api/channel/national-geographic-wild/manifest.m3u8',
   genre: "Education & Documentary",
    logo: '../assets/img/channel logo/natgeo_wild.png',
}, 
  {
   name: 'BBC EARTH',
    genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/bbcearth.png',
    stream: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_bbcearth_hd1.mpd',
    drm: {
      keyId: '34ce95b60c424e169619816c5181aded',
      key: '0e2a2117d705613542618f58bf26fc8e'
    }
  },
  {
   name: 'BBC NEWS',
    genre: "News and Information",
    logo: '../assets/img/channel logo/bbc_news.png',
    stream: 'https://qp-pldt-live-grp-04-prod.akamaized.net/out/u/bbcworld_news_sd.mpd',
  drm: {
      keyId: 'f59650be475e4c34a844d4e2062f71f3',
      key: '119639e849ddee96c4cec2f2b6b09b40'
    }
  },
   {
   name: 'BBC Lifestyle',
     genre: "Lifestyle",
    logo: '../assets/img/channel logo/BBCLifestyle.png',
    stream: 'https://cdn4.skygo.mn/live/disk1/BBC_lifestyle/HLSv3-FTA/BBC_lifestyle.m3u8',
  },

   {
   name: 'HISTORY',
     genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/History.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_historyhd.mpd',
    drm: {
      keyId: 'a7724b7ca2604c33bb2e963a0319968a',
      key: '6f97e3e2eb2bade626e0281ec01d3675'
    }
  },
  {
   name: 'DISCOVERY',
    genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/discovery-channel.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_discovery.mpd',
    drm: {
      keyId: 'd9ac48f5131641a789328257e778ad3a',
      key: 'b6e67c37239901980c6e37e0607ceee6'
    }
  },
 
  {
   name: 'ASIA FOODNETWORK',
        genre: "Lifestyle",
    logo: '../assets/img/channel logo/afn.png',
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/asianfoodnetwork_sd.mpd',
    drm: {
      keyId: '1619db30b9ed42019abb760a0a3b5e7f',
      key: '5921e47fb290ae263291b851c0b4b6e4'
    }
    
  },
   {
   name: 'FOODNETWORK',
         genre: "Lifestyle",
    logo: '../assets/img/channel logo/Food_Network.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/cg_foodnetwork_hd1.mpd',
    drm: {
      keyId: 'b7299ea0af8945479cd2f287ee7d530e',
      key: 'b8ae7679cf18e7261303313b18ba7a14'
    }
  },
{ name: 'CBEEBIES',
    logo: '../assets/img/channel logo/CBeebies.png',
    genre: "Kids",
    stream: 'https://cdn4.skygo.mn/live/disk1/Cbeebies/HLSv3-FTA/Cbeebies.m3u8',
  },
   { name: 'DISNEY CHANNEL',
    logo: '../assets/img/channel logo/Disney_Channel.png',
    genre: "Kids",
    stream: 'https://uselector.cdn.intigral-ott.net/DIS/DIS.isml/manifest.mpd',
    drm: {
      keyId: '72800c62fcf2bfbedd9af27d79ed35d6',
      key: 'b6ccb9facb2c1c81ebe4dfaab8a45195'
    }
  },
   { name: 'DISNEY XD',
    logo: '../assets/img/channel logo/disneyxd.png',
    genre: "Kids",
    stream: 'https://a53aivottepl-a.akamaihd.net/pdx-nitro/live/clients/dash/enc/jts4tzzv1k/out/v1/8a5b29f7068c415aa371ea95743382e6/cenc.mpd',
    drm: {
      keyId: '39cebece8b36640f9ba3f248ecfdf86a',
      key: 'fad936249e036830aa5bef41bec05326'
    }
  },
  { name: 'DISNEY JR.',
    logo: '../assets/img/channel logo/Disney_Junior.png',
    genre: "Kids",
    stream: 'https://uselector.cdn.intigral-ott.net/DJR/DJR.isml/manifest.mpd',
    drm: {
      keyId: 'f5df57914a0922d5d5ed6b0a4af6290a',
      key: 'c62b10a180d1770a355b3c4cb6506ca0'
    }
  },
  { name: 'MOONBUG',
    logo: '../assets/img/channel logo/moonbug.jpg',
    genre: "Kids",
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_moonbug_kids_sd.mpd',
    drm: {
      keyId: '0bf00921bec94a65a124fba1ef52b1cd',
      key: '0f1488487cbe05e2badc3db53ae0f29f'
    }
  },
  { name: 'CARTOON NETWORK',
    logo: '../assets/img/channel logo/cartoon_network.png',
    genre: "Kids",
    stream: 'https://qp-pldt-live-grp-12-prod.akamaized.net/out/u/dr_cartoonnetworkhd.mpd',
    drm: {
      keyId: 'a2d1f552ff9541558b3296b5a932136b',
      key: 'cdd48fa884dc0c3a3f85aeebca13d444'
    }
  },
  {
   name: 'DREAMWORK TAGALIZED',
    logo: '../assets/img/channel logo/dreamworks.jpg',
    genre: "Kids",
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/cg_dreamworktag.mpd',
    drm: {
      keyId: '564b3b1c781043c19242c66e348699c5',
      key: 'd3ad27d7fe1f14fb1a2cd5688549fbab'
    }
  },
  {
   name: 'DREAMWORK HD',
    logo: '../assets/img/channel logo/dreamworks.jpg',
    genre: "Kids",
    stream: 'https://qp-pldt-live-grp-02-prod.akamaized.net/out/u/cg_dreamworks_hd1.mpd',
    drm: {
      keyId: '4ab9645a2a0a47edbd65e8479c2b9669',
      key: '8cb209f1828431ce9b50b593d1f44079'
    }
  },
   {
   name: 'NICK JR',
    logo: '../assets/img/channel logo/nickjr.jpg',
    genre: "Kids",
    stream: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/9982/default_ott.mpd',
    drm: {
      keyId: 'fa65220c9f76e424173899df533a6d10',
      key: 'b4abbee95b69b3e80a0d141272c870db'
    }
  },
  {
   name: 'NICKELODEON HD',
    logo: '../assets/img/channel logo/nickelodeon.jpg',
    genre: "Kids",
    stream: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/2511/default_ott.mpd',
    drm: {
      keyId: 'd8520e96a1283ab6e5be538474bfa810',
      key: 'bda5f7bbc1e44096f779a0619fe9881f'
    }
  },
  {
   name: 'NickMusic',
    logo: '../assets/img/channel logo/nickmusic.png',
    genre: "Music",
    stream: 'https://live-atv-cdn.izzigo.tv/4/out/u/dash/NICKMUSICSD/default.mpd',
    drm: {
      keyId: '96c869392d2e908eaf78a9fcfa8c3107',
      key: 'cd307966418dafe8fa5e673f8c172f39'
    }
  },
    {
   name: 'TeenNick',
    logo: '../assets/img/channel logo/teennick.png',
    genre: "Kids",
    stream: 'https://live-atv-cdn.izzigo.tv/4/out/u/dash/TEENNICKHD/default.mpd',
    drm: {
      keyId: '57588399a2a939927418a588126e316d',
      key: '6566f7996a957773701e2de8741ce176'
    }
  },
  {
    name: "Cartoonito",
    stream: 'https://cdn3.skygo.mn/live/disk1/Boomerang/HLSv3-FTA/Boomerang.m3u8',
    logo: '../assets/img/channel logo/CARTOONITO.png',
    genre: "Kids",
}, 
  {
    name: "Zoomoo",
    stream: 'https://cdn3.skygo.mn/live/disk1/Zoomoo/HLSv3-FTA/Zoomoo.m3u8',
   logo: '../assets/img/channel logo/zoomoo.png',
    genre: "Kids",
},
  {
   name: 'Studio Universal',
    genre: "Movies",
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Logo_Studio_Universal.svg/1200px-Logo_Studio_Universal.svg.png',
    stream: 'https://fta1-cdn-flr.visionplus.id/out/v1/dc63bd198bc44193b570e0567ff5b22c/index.mpd',
    drm: {
      keyId: 'b4a7b3289eff493d8700becf2e2a1157',
      key: 'bfbcfcb8137dd565a7f4b5ce7800c1f0'
    }
  },
   {
   name: 'Filmrise Horror',
    genre: "Movies",
    logo: '../assets/img/channel logo/FilmRise_Horror.jpg',
    stream: 'https://apollo.production-public.tubi.io/live/ac-filmrise-horror.m3u8',
  },
 {
   name: 'Miramax Movies',
    genre: "Movies",
   logo: '../assets/img/channel logo/miramax.png',
    stream: 'https://raw.githubusercontent.com/mystery75/m3u8/main/MIRAMAX.m3u8',
  },
  {
   name: 'Ion Plus',
    genre: "Movies",
    logo: '../assets/img/channel logo/ION_Plus.png',
    stream: 'https://raw.githubusercontent.com/mystery75/m3u8/main/IONPLUS.m3u8',
  },
  {
   name: 'Ion Mystery',
    genre: "Movies",
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/ION_Mystery_logo.svg/1200px-ION_Mystery_logo.svg.png',
    stream: 'https://raw.githubusercontent.com/mystery75/m3u8/main/IONMYSTERY.m3u8',
  },
  {
   name: 'Dove Channel',
    genre: "Movies",
    logo: 'https://the-bithub.com/dove',
    stream: 'https://raw.githubusercontent.com/mystery75/m3u8/main/DOVE.m3u8',
  },

  {
   name: 'HITS NOW',
    genre: "Movies",
    logo: '../assets/img/channel logo/Hits Now.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/cg_hitsnow.mpd',
    drm: {
      keyId: '14439a1b7afc4527bb0ebc51cf11cbc1',
      key: '92b0287c7042f271b266cc11ab7541f1'
    }
  },
  {
   name: 'MOVIE BOX',
    genre: "Movies",
    logo: '../assets/img/channel logo/moviebox.png',
    stream: 'https://cdn3.skygo.mn/live/disk1/Moviebox/HLSv3-FTA/Moviebox.m3u8',
  },
  {
   name: 'Warner TV HD',
    genre: "Movies",      
    logo: '../assets/img/channel logo/warner-tv.png',
    stream: 'https://qp-pldt-live-grp-05-prod.akamaized.net/out/u/cg_warnerhd.mpd',
drm: {
      keyId: '4503cf86bca3494ab95a77ed913619a0',
      key: 'afc9c8f627fb3fb255dee8e3b0fe1d71'
    }
  },
  { name: "HBO HD", logo: "../assets/img/channel logo/HBOHD.png", stream: "https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_hbohd.mpd", drm: "ZDQ3ZWJhYmY3YTIxNDMwYjgzYThjNGI4MmQ5ZWY2YjE6NTRjMjEzYjJiNWY4ODVmMWUwMjkwZWU0MTMxZDQyNWI=" },
 {
   name: 'HBO FAMILY',
   genre: "Kids",
    logo: '../assets/img/channel logo/HBOFamily.png',
    stream: 'https://qp-pldt-live-grp-03-prod.akamaized.net/out/u/cg_hbofam.mpd',
    drm: {
      keyId: '872910c843294319800d85f9a0940607',
      key: 'f79fd895b79c590708cf5e8b5c6263be'
    }
  },
  {
   name: 'HBO SIGNATURE',
    genre: "Movies",
    logo: '../assets/img/channel logo/HBOsignature.png',
    stream: 'https://qp-pldt-live-grp-01-prod.akamaized.net/out/u/cg_hbosign.mpd',
    drm: {
      keyId: 'a06ca6c275744151895762e0346380f5',
      key: '559da1b63eec77b5a942018f14d3f56f'
    }
  },
   {
   name: 'HBO HITS',
     genre: "Movies",
    logo: '../assets/img/channel logo/HBOHits.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/cg_hbohits.mpd',
    drm: {
      keyId: 'b04ae8017b5b4601a5a0c9060f6d5b7d',
      key: 'a8795f3bdb8a4778b7e888ee484cc7a1'
    }
  },
   {
   name: 'HITS HD',
     genre: "Kids",
    logo: '../assets/img/channel logo/Hits.png',
    stream: 'https://qp-pldt-live-grp-04-prod.akamaized.net/out/u/hits_hd1.mpd',
    drm: {
      keyId: 'dac605bc197e442c93f4f08595a95100',
      key: '975e27ffc1b7949721ee3ccb4b7fd3e5'
    }
  },
     {name: "STARZ",
    stream: 'https://mecdn3.starz.com/assets/39737/20250329151813691/dezmund_edgeClassic_CTR.mpd',
  genre: "Movies",
     logo: '../assets/img/channel logo/Starz.png',
    drm: {
       keyId: 'a489c9e7df5f4d9599b586e0ff7ef39c',
        key: 'deee93584438d88abf10ba7ef8f1ee68'
    }
},
  
     {name: "STARZ 1",
    stream: 'https://stream.video.9c9media.com/5...944303887/fe/f/crave/starz1/manifest.mpd?u=li',
  genre: "Movies",
     logo: '../assets/img/channel logo/Starz.png',
    drm: {
       keyId: '5ebcf53fd1794237aa02af52413e0c2a',
        key: 'bd2f5d20887507da6f26401b1d95aeee'
    }
},
   {name: "STARZ 2",
    stream: 'https://stream.video.9c9media.com/6...945004845/fe/f/crave/starz2/manifest.mpd?u=li',
  genre: "Movies",
     logo: '../assets/img/channel logo/Starz.png',
    drm: {
       keyId: '5389bf9aa04e467aac818fac7138f8f4',
        key: 'ebb8e28d9081a462015de790e76759f0'
    }
},
   {
   name: 'Movies Now',
     genre: "Movies",
    logo: 'https://bestmediainfo.com/uploads/2017/08/MOVIES-NOW-LOGO_6.jpg',
    stream: 'https://times-ott-live.akamaized.net/moviesnow_wv_drm/index.mpd',
    drm: {
      keyId: '40f019b86241d23ef075633fd7f1e927',
      key: '058dec845bd340178a388edd104a015e'
    }
  },
   {
   name: 'Crave 1',
     genre: "Movies",
    logo: '../assets/img/channel logo/crave1.png',
    stream: 'https://live-crave.video.9c9media.com/137c6e2e72e1bf67b82614c7c9b216d6f3a8c8281748505659713/fe/f/crave/crave1/manifest.mpd',
    drm: {
      keyId: '4a107945066f45a9af2c32ea88be60f4',
      key: 'df97e849d68479ec16e395feda7627d0'
    }
  },
   {
   name: 'Crave 2',
     genre: "Movies",
    logo: '../assets/img/channel logo/crave2.png',
    stream: 'https://live-crave.video.9c9media.com/ab4332c60e19b6629129eeb38a2a6ac6db5df2571721750022187/fe/f/crave/crave2/manifest.mpd',
    drm: {
      keyId: '4ac6eaaf0e5e4f94987cbb5b243b54e8',
      key: '8bb3f2f421f6afd025fa46c784944ad6'
    }
  },
   {
   name: 'AMC+',
     genre: "Movies",
    logo: '../assets/img/channel logo/amc.png',
    stream: 'https://a148aivottlinear-a.akamaihd.net/OTTB/PDX/clients/dash/enc/0f5clvxn6o/out/v1/d5a953bb19734fa3baa1776266887fcb/cenc.mpd',
    drm: {
      keyId: '59a51164c2c915352f04066a06f6e807',
      key: 'eba5cc362d1d63c0fe6460febca0fd11'
    }
  },
   {
   name: 'AMC Thrillers',
     genre: "Movies",
    logo: '../assets/img/channel logo/amc_thrillers.png',
    stream: 'https://436f59579436473e8168284cac5d725f.mediatailor.us-east-1.amazonaws.com/v1/master/44f73ba4d03e9607dcd9bebdcb8494d86964f1d8/Plex_RushByAMC/playlist.m3u8',
  },
   {
   name: 'THRILL',
     genre: "Movies",
    logo: '../assets/img/channel logo/Thrill.png',
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_thrill_sd.mpd',
    drm: {
      keyId: '928114ffb2394d14b5585258f70ed183',
      key: 'a82edc340bc73447bac16cdfed0a4c62'
    }
  },
   {
   name: 'TAP TV',
     genre: "Movies",
    logo: '../assets/img/channel logo/TAPTV.png',
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_taptv_sd.mpd',
    drm: {
      keyId: 'f6804251e90b4966889b7df94fdc621e',
      key: '55c3c014f2bd12d6bd62349658f24566'
    }
  },
  {
   name: 'TAP SPORTS',
    genre: "Sports",
    logo: '../assets/img/channel logo/tapsports.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_tapsports.mpd',
    drm: {
      keyId: 'eabd2d95c89e42f2b0b0b40ce4179ea0',
      key: '0e7e35a07e2c12822316c0dc4873903f'
    }
  },
   {
   name: 'TAP ACTIONFLIX',
     genre: "Movies",
    logo: '../assets/img/channel logo/Tap-Action-Flix.jpg',
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_tapactionflix_hd1.mpd',
    drm: {
      keyId: 'bee1066160c0424696d9bf99ca0645e3',
      key: 'f5b72bf3b89b9848de5616f37de040b7'
    }
  },
   {
   name: 'CRIME INVESTIGATION',
     genre: "General Entertainment",
    logo: '../assets/img/channel logo/Crime_Investigation.png',
    stream: 'https://qp-pldt-live-grp-12-prod.akamaized.net/out/u/dr_crime_invest.mpd',
    drm: {
      keyId: '21e2843b561c4248b8ea487986a16d33',
      key: 'db6bb638ccdfc1ad1a3e98d728486801'
    }
  },
  {
   name: 'RAKUTEN VIKI',
    genre: "Asian Dramas",
    logo: '../assets/img/channel logo/rakuten-viki.png',
    stream: 'https://newidco-rakutenviki-2-eu.xiaomi.wurl.tv/playlist.m3u8',
  },
  {
   name: 'KIX',
    genre: "Asian Dramas",
    logo: '../assets/img/channel logo/kix.png',
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/kix_hd1.mpd',
    drm: {
      keyId: 'a8d5712967cd495ca80fdc425bc61d6b',
      key: 'f248c29525ed4c40cc39baeee9634735'
    }
  },
    { name: "AXN", genre: "Movies", logo: "../assets/img/channel logo/AXN.png", stream: "https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_axn_sd.mpd", drm: "ZmQ1ZDkyOGY1ZDk3NGNhNDk4M2Y2ZTkyOTVkZmU0MTA6M2FhYTAwMWRkYzE0MmZlZGJiOWQ1NTU3YmU0Mzc5MmY=" },
{
   name: 'TVN PREMIUM',
    genre: "Movies",
    logo: '../assets/img/channel logo/TVN.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/cg_tvnpre.mpd',
    drm: {
      keyId: 'e1bde543e8a140b38d3f84ace746553e',
      key: 'b712c4ec307300043333a6899a402c10'
    }
  }, 
  {
   name: 'TVN MOVIES',
    genre: "Movies",
    logo: '../assets/img/channel logo/TVNMovies.png',
    stream: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/2406/default_ott.mpd',
    drm: {
      keyId: '8e269c8aa32ad77eb83068312343d610',
      key: 'd12ccebafbba2a535d88a3087f884252'
    }
  }, 
  {
   name: 'TVN MOVIES PINOY',
    genre: "Movies",
    logo: '../assets/img/channel logo/TVNMovies_Pinoy.png',
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/cg_tvnmovie.mpd',
    drm: {
      keyId: '2e53f8d8a5e94bca8f9a1e16ce67df33',
      key: '3471b2464b5c7b033a03bb8307d9fa35'
    }
  }, 
  {
   name: 'TMC',
    genre: "Movies",
    logo: '../assets/img/channel logo/TMC.png',
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/cg_tagalogmovie.mpd',
    drm: {
      keyId: '96701d297d1241e492d41c397631d857',
      key: 'ca2931211c1a261f082a3a2c4fd9f91b'
    }
  },
   {
   name: 'ROCK ENTERTAINMENT',
     genre: "Movies",
    logo: '../assets/img/channel logo/rock-entertainment.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_rockentertainment.mpd',
    drm: {
      keyId: 'e4ee0cf8ca9746f99af402ca6eed8dc7',
      key: 'be2a096403346bc1d0bb0f812822bb62'
    }
  },
   {
   name: 'KNOWLEDGE CH',
     genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/Knowledge-Channel.png',
    genre: "Kids",
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_knowledgechannel.mpd',
    drm: {
      keyId: '0f856fa0412b11edb8780242ac120002',
      key: '783374273ef97ad3bc992c1d63e091e7'
    }
  },
  { name: "CINEMAX", genre: "Movies", logo: "../assets/img/channel logo/cinemax.png", stream: "https://qp-pldt-live-grp-01-prod.akamaized.net/out/u/cg_cinemax.mpd", drm: "YjIwN2M0NDMzMjg0NDUyM2EzYTNiMDQ2OWU1NjUyZDc6ZmU3MWFlYTM0NmRiMDhmOGM2ZmJmMDU5MjIwOWY5NTU=" },
  {
   name: 'ROCK ACTION',
    genre: "Movies",
    logo: '../assets/img/channel logo/rockaction.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_rockextreme.mpd',
    drm: {
      keyId: '0f852fb8412b11edb8780242ac120002',
      key: '4cbc004d8c444f9f996db42059ce8178'
    }
  },
   {
   name: 'CGTN',
     genre: "Educational and Documentary",
    logo: '../assets/img/channel logo/CGTN.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_cgtn.mpd',
    drm: {
      keyId: '0f854ee4412b11edb8780242ac120002',
      key: '9f2c82a74e727deadbda389e18798d55'
    }
  },
   {
   name: 'FRANCE 24',
     genre: "News and Information",
    logo: '../assets/img/channel logo/france24.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_france24.mpd',
    drm: {
      keyId: '257f9fdeb39d41bdb226c2ae1fbdaeb6',
      key: 'e80ead0f4f9d6038ab34f332713ceaa5'
    }
  },
   {
   name: 'ABC AUSTRALIA',
     genre: "News and Information",
    logo: '../assets/img/channel logo/ABCAustralia.png',
    stream: 'https://qp-pldt-live-grp-10-prod.akamaized.net/out/u/dr_abc_aus.mpd',
    drm: {
      keyId: '389497f9f8584a57b234e27e430e04b7',
      key: '3b85594c7f88604adf004e45c03511c0'
    }
  },
  {
   name: 'CHANNEL NEWS ASIA',
    genre: "News and Information",
    logo: '../assets/img/channel logo/cna.png',
    stream: 'https://qp-pldt-live-grp-13-prod.akamaized.net/out/u/dr_channelnewsasia.mpd',
    drm: {
      keyId: 'b259df9987364dd3b778aa5d42cb9acd',
      key: '753e3dba96ab467e468269e7e33fb813'
    }
  },
  {
   name: 'LOTUS MACAU',
    genre: "Movies",
    logo: '../assets/img/channel logo/lotusmacau.png',
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/lotusmacau_prd.mpd',
    drm: {
      keyId: '60dc692e64ea443a8fb5ac186c865a9b',
      key: '01bdbe22d59b2a4504b53adc2f606cc1'
    }
  },
  {
   name: 'FASHION TV',
    genre: "Lifestyle",
    logo: '../assets/img/channel logo/fashiontv.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_fashiontvhd.mpd',
    drm: {
      keyId: '971ebbe2d887476398e97c37e0c5c591',
      key: '472aa631b1e671070a4bf198f43da0c7'
    }
  },
  {
   name: 'BLOOMBERG',
    genre: "News and Information",
    logo: '../assets/img/channel logo/Bloomberg.png',
    stream: 'https://qp-pldt-live-grp-09-prod.akamaized.net/out/u/bloomberg_sd.mpd',
    drm: {
      keyId: 'ef7d9dcfb99b406cb79fb9f675cba426',
      key: 'b24094f6ca136af25600e44df5987af4'
    }
  },
   {
   name: 'LIFETIME',
     genre: "Lifestyle",
    logo: '../assets/img/channel logo/lifetime.png',
    stream: 'https://qp-pldt-live-grp-11-prod.akamaized.net/out/u/dr_lifetime.mpd',
    drm: {
      keyId: 'cf861d26e7834166807c324d57df5119',
      key: '64a81e30f6e5b7547e3516bbf8c647d0'
    }
  },
   {
   name: 'HGTV',
     genre: "Lifestyle",
    logo: '../assets/img/channel logo/HGTV.png',
    stream: 'https://qp-pldt-live-grp-08-prod.akamaized.net/out/u/hgtv_hd1.mpd',
    drm: {
      keyId: 'f0e3ab943318471abc8b47027f384f5a',
      key: '13802a79b19cc3485d2257165a7ef62a'
    }
  },
  {
   name: 'ARIRANG',
    genre: "News and Information",
    logo: '../assets/img/channel logo/arirang.png',
    stream: 'https://qp-pldt-live-grp-01-prod.akamaized.net/out/u/arirang_sd.mpd',
    drm: {
      keyId: '13815d0fa026441ea7662b0c9de00bcf',
      key: '2d99a55743677c3879a068dd9c92f824'
    }
  },
  {
    name: "IBC 13",
    stream: 'https://qp-pldt-live-grp-07-prod.akamaized.net/out/u/ibc13_sd_new.mpd',
    genre: "News and Information",
     logo: '../assets/img/channel logo/ibc.jpg',
    drm: {
        keyId: '16ecd238c0394592b8d3559c06b1faf5',
        key: '05b47ae3be1368912ebe28f87480fc84'
    }
}, 
  {
    name: "Sari-Sari",
    stream: 'https://qp-pldt-live-grp-06-prod.akamaized.net/out/u/cg_sari_sari_sd.mpd',
    genre: "General Entertainment",
     logo: '../assets/img/channel logo/sari-sari.png',
    drm: {
        keyId: '0a7ab3612f434335aa6e895016d8cd2d',
        key: 'b21654621230ae21714a5cab52daeb9d'
    }
},
  {
    name: "Channel 11",
    stream: 'https://cdn3.skygo.mn/live/disk1/Channel11/HLSv3-FTA/Channel11.m3u8',
    genre: "Movies",
     logo: '../assets/img/channel logo/channel11.png',
}, 
   {
    name: "C1",
    stream: 'https://cdn3.skygo.mn/live/disk1/C1/HLSv3-FTA/C1.m3u8',
   genre: "Movies",
     logo: '../assets/img/channel logo/C1.png',
},
  {
    name: "NHK World",
    stream: 'https://cdn3.skygo.mn/live/disk1/NHK_World/HLSv3-FTA/NHK_World.m3u8',
    genre: "News and Information",
     logo: '../assets/img/channel logo/NHK.png',
}, {
    name: "NHK World Premium",
    stream: 'https://cdn3.skygo.mn/live/disk1/NHK_World_Premium/HLSv3-FTA/NHK_World_Premium.m3u8',
    genre: "General Entertainment",
     logo: '../assets/img/channel logo/NHK_premium.png',
}, 
  {
    name: "Amazon Movies",
    stream: 'https://abbfefcaaaaaaaamd5xd44ij4vbyj.a17d0dfbc05b48999f461f3f6cff0eb6.emt.cf.ww.aiv-cdn.net/pdx-nitro/live/clients/dash/enc/oynu8tcxfa/out/v1/ab567b96658c4d84ae1fc6c67110987c/cenc.mpd',
    genre: "Movies",
     logo: 'https://the-bithub.com/amznmovies',
    drm: {
        keyId: '3e429eb91a1791d55df2a554dc58dda7',
        key: '2f688f94ef580a61eada6932598137e4'
    }
},
  {
    name: "MTV",
    stream: 'https://live-atv-cdn.izzigo.tv/2/out/u/dash/MTVHD/default.mpd',
    genre: "Music",
     logo: '../assets/img/channel logo/MTV.png',
    drm: {
        keyId: 'ac11ba753fcabc56b965e1801ff8df19',
        key: '64a7852cc7737515ac71c017f03fdd32'
    }
},
   {
    name: "MTV Live",
    stream: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/5014/default_ott.mpd',
    genre: "Music",
     logo: '../assets/img/channel logo/mtv-live.png',
    drm: {
        keyId: '3ac2542a4f7be746633db07647451710',
        key: '22f964a6d6927ccdba482e775cdff190'
    }
},
  {name: "MTV 00s",
    stream: 'https://live-atv-cdn.izzigo.tv/3/out/u/dash/MTV00HD/default.mpd',
    genre: "Music",
     logo: '../assets/img/channel logo/MTV00s.png',
    drm: {
        keyId: '53a3776a034dbe5f483d0f3a46f5fddf',
        key: 'db9d0d03592fbe9f4429ef1a82eb47aa'
    }
},
   {name: "MTV Hits",
    stream: 'https://live-atv-cdn.izzigo.tv/4/out/u/dash/MTVHITSSD/default.mpd',
    genre: "Music",
     logo: '../assets/img/channel logo/MTVhits.png',
    drm: {
        keyId: '0b5868bc161634a033a19a20f3f3595d',
        key: 'b336c8c6bb249b1a5f89dace8d9889e5'
    }
},
   {name: "Club MTV",
    stream: 'https://live-atv-cdn.izzigo.tv/4/out/u/dash/CLUBMTVSD/default.mpd',
 genre: "Music",
     logo: '../assets/img/channel logo/clubmtv.png',
    drm: {
        keyId: '1da2977f5fed3acb602cc2c8b57c41c1',
        key: '09aaed2aeee31130fa8f869faff25ee5'
    }
},
   {name: "MTV 80s",
    stream: 'https://live-atv-cdn.izzigo.tv/4/out/u/dash/MTV80SSD/default.mpd',
  genre: "Music",
     logo: '../assets/img/channel logo/mtv80s.png',
    drm: {
        keyId: 'b515c27589fda8f9607e7949697de6b3',
        key: '27d2061c0972931e18d43fbb3301c6f0'
    }
},
   {name: "Al jazeera",
    stream: 'https://linearjitp-playback.astro.com.my/dash-wv/linear/2110/default_ott.mpd',
  genre: "News and Information",
     logo: '../assets/img/channel logo/aljazeera.png',
    drm: {
        keyId: 'b1fbd0874e7923f5b05929a042aa0610',
        key: '6c3c498113abffdf454dc935319a794d'
    }
},
   {name: "RTS 1 HD",
    stream: 'https://viamotionhsi.netplus.ch/live/eds/rts1hd/browser-dash/rts1hd.mpd',
  genre: "Sports",
     logo: 'https://picserve.netplus.ch/channels/rts1hd.png'},
  
    {name: "RTS 2 HD",
    stream: 'https://viamotionhsi.netplus.ch/live/eds/rts2hd/browser-dash/rts2hd.mpd',
  genre: "Sports",
     logo: 'https://picserve.netplus.ch/channels/rts2hd.png'},
 
   {name: "Eurosport 1",
    stream: 'https://v4-pan-n79-cdn-01.live.cdn.cgates.lt/live/dash/561802/index.mpd',
  genre: "Sports",
     logo: '../assets/img/channel logo/eurosport1.png',
    drm: {
        keyId: '01a665d487aa4c1c898c9eb0ff1a21df',
        key: 'a0b9df5f92e6b218ddb6aa40a2cd996d'
    }
},
  {name: "Eurosport 2",
    stream: 'https://v4-pan-n79-cdn-01.live.cdn.cgates.lt/live/dash/561705/index.mpd',
  genre: "Sports",
     logo: '../assets/img/channel logo/eurosport2.png',
    drm: {
        keyId: '657707bbd1e240e08bd6969df27fef7c',
        key: '364e00581c1432f4175e4a2e8e0cd57e'
    }
},
];

// Initial load
loadChannels(channels);
