const { getStore } = require('@netlify/blobs');

const MANIFEST_KEY = 'manifest.json';

function store() {
  return getStore('instagram-queue');
}

async function readManifest() {
  const raw = await store().get(MANIFEST_KEY, { type: 'json' });
  return raw || { items: [] };
}

async function writeManifest(manifest) {
  await store().setJSON(MANIFEST_KEY, manifest);
}

async function addItem(item) {
  const manifest = await readManifest();
  manifest.items.push(item);
  await writeManifest(manifest);
  return item;
}

async function nextPending(manifest) {
  return manifest.items.find((item) => item.status === 'pending');
}

module.exports = { readManifest, writeManifest, addItem, nextPending };
