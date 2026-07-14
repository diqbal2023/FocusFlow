/**
 * FocusFlow targets Windows only.
 * Android/iOS app directories were removed; leave project platform stubs as empty
 * objects because the RN CLI rejects `null` for project.ios / project.android.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
    windows: {},
  },
};
