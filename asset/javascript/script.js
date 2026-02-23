let config = null;

const els = {
    game: document.getElementById('Game'),
    map: document.getElementById('Map'),
    jenis: document.getElementById('Jenis'),
    paket: document.getElementById('Paket'),
    nama: document.getElementById('nama'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    detailmap: document.getElementById('detailmap'),
    jenisPaketRow: document.getElementById('jenis-paket-row'),
    labelmap: document.getElementById('labelmap'),
    labeljenis: document.getElementById('labeljenis'),
    labelpaket: document.getElementById('labelpaket'),
    btnKirim: document.getElementById('btnKirim'),
    btnText: document.getElementById('btnText'),
    btnLoading: document.getElementById('btnLoading')
};

// Load JSON
fetch('asset/data/data.json')
    .then(res => {
        if (!res.ok) throw new Error('Gagal load data.json');
        return res.json();
    })
    .then(data => {
        config = data;
        populateGames();
    })
    .catch(err => {
        console.error('Error loading JSON:', err);
        showModal('Yah :( Gagal di memuat... silahkan Hubungi admin!!');
    });

function populateGames() {
    if (!config?.games) return;
    els.game.innerHTML = '<option value="">-- Pilih Game --</option>';
    Object.keys(config.games).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        els.game.appendChild(opt);
    });
}

els.game.addEventListener('change', () => {
    resetLower('map');
    const game = els.game.value;
    if (game && config.games[game]) {
        els.detailmap.style.display = 'block';
        els.labelmap.textContent = "Map/Mode";
        els.labelmap.dataset.tooltip = "Pilih map atau mode permainan";

        const maps = Object.keys(config.games[game].maps || {});
        populateSelect(els.map, [
            { v: "", t: "-- Pilih Map/Mode --" },
            ...maps.map(m => ({ v: m, t: m }))
        ]);

        els.map.focus();
    }
    checkForm();
});

els.map.addEventListener('change', () => {
    resetLower('jenis');
    const game = els.game.value;
    const map = els.map.value;
    if (game && map && config.games[game]?.maps?.[map]) {
        els.jenisPaketRow.style.display = 'flex';

        els.labeljenis.textContent = "Jenis Joki";
        els.labeljenis.dataset.tooltip = "Pilih jenis layanan joki";

        const jenisObj = config.games[game].maps[map].jenis;
        const jenisOptions = Object.keys(jenisObj).map(key => ({
            v: key,
            t: `Joki ${capitalize(key)}`
        }));
        populateSelect(els.jenis, [
            { v: "", t: "-- Pilih Jenis Joki --" },
            ...jenisOptions
        ]);

        // Reset paket dan labelnya
        populateSelect(els.paket, [{ v: "", t: "-- Pilih Paket --" }]);
        els.labelpaket.textContent = "Paket";
        els.labelpaket.dataset.tooltip = "Pilih paket setelah memilih jenis";

        els.jenis.focus();
    }
    checkForm();
});

els.jenis.addEventListener('change', () => {
    const game = els.game.value;
    const map = els.map.value;
    const jenis = els.jenis.value;

    if (game && map && jenis && config.games[game]?.maps?.[map]?.jenis?.[jenis]) {
        const info = config.games[game].maps[map].jenis[jenis];
        els.labelpaket.textContent = info.label; // FIX UTAMA: label paket berubah disini
        els.labelpaket.dataset.tooltip = "Pilih paket sesuai kebutuhan";

        populateSelect(els.paket, [
            { v: "", t: "-- Pilih Paket --" },
            ...info.options.map(opt => ({ v: opt.value, t: opt.text }))
        ]);

        els.paket.focus();
    } else {
        populateSelect(els.paket, [{ v: "", t: "-- Pilih Paket --" }]);
        els.labelpaket.textContent = "Paket";
    }
    checkForm();
});

// Event input
['nama', 'username', 'password', 'Game', 'Map', 'Jenis', 'Paket'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', checkForm);
        el.addEventListener('change', checkForm);
    }
});

function populateSelect(select, options) {
    select.innerHTML = '';
    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.v;
        o.textContent = opt.t;
        select.appendChild(o);
    });
}

function resetLower(level) {
    if (level === 'map') {
        els.detailmap.style.display = 'none';
        els.jenisPaketRow.style.display = 'none';
        els.map.value = '';
        els.jenis.value = '';
        els.paket.value = '';
    }
    checkForm();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function checkForm() {
    const allFilled = 
        els.nama.value.trim() &&
        els.game.value &&
        els.map.value &&
        els.jenis.value &&
        els.paket.value &&
        els.username.value.trim() &&
        els.password.value.trim();

    els.btnKirim.disabled = !allFilled;

    document.querySelectorAll('.form-group.error').forEach(el => el.classList.remove('error'));
}

function kirimPesan() {
    if (!config) return showModal("Data konfigurasi belum dimuat. Refresh halaman.");

    const nama      = els.nama.value.trim();
    const game      = els.game.value;
    const map       = els.map.value;
    const jenisText = els.jenis.options[els.jenis.selectedIndex]?.textContent || '';
    const paketText = els.paket.options[els.paket.selectedIndex]?.textContent || '';
    const username  = els.username.value.trim();
    const password  = els.password.value.trim();

    let hasError = false;
    if (!nama)     { els.nama.parentElement.classList.add('error'); hasError = true; }
    if (!game)     { els.game.parentElement.classList.add('error'); hasError = true; }
    if (!map)      { els.map.parentElement.classList.add('error'); hasError = true; }
    if (!jenisText) { els.jenis.parentElement.classList.add('error'); hasError = true; }
    if (!paketText) { els.paket.parentElement.classList.add('error'); hasError = true; }
    if (!username) { els.username.parentElement.classList.add('error'); hasError = true; }
    if (!password) { els.password.parentElement.classList.add('error'); hasError = true; }

    if (hasError) {
        return showModal("Ada field yang masih kosong. Mohon dicek kembali.");
    }

    els.btnKirim.classList.add('loading');
    els.btnKirim.disabled = true;

    const pesan = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       PESANAN JOKI ${game.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nama          : ${nama}
Game          : ${game}
Map/Mode      : ${map}
Jenis Joki    : ${jenisText}
Paket         : ${paketText}
Username/ID   : ${username}
Password      : ${password}
Payment       : (Tunggu konfirmasi Admin)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Terima kasih admin, mohon proses secepatnya!`;

    const encoded = encodeURIComponent(pesan);
    window.open(`https://wa.me/${config.admin_wa}?text=${encoded}`, '_blank');

    setTimeout(() => {
        els.btnKirim.classList.remove('loading');
        checkForm();
    }, 1500);
}

function showModal(msg) {
    document.getElementById('modalMessage').textContent = msg;
    document.getElementById('errorModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('errorModal').style.display = 'none';
}

window.onclick = e => {
    if (e.target.id === 'errorModal') closeModal();
};