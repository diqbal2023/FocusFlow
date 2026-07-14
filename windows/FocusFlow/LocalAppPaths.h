#pragma once

#include "NativeModules.h"

#include <filesystem>
#include <string>

#ifdef _WIN32
#include <windows.h>
#endif

using namespace winrt::Microsoft::ReactNative;

/**
 * Minimal Windows helper so SQLite can open a writable per-user path
 * without depending on react-native-fs.
 */
REACT_MODULE(LocalAppPaths);
struct LocalAppPaths {
  REACT_SYNC_METHOD(getLocalDatabaseDirectory);
  static std::string getLocalDatabaseDirectory() noexcept {
#ifdef _WIN32
    try {
      auto folder = winrt::Windows::Storage::ApplicationData::Current().LocalFolder();
      return winrt::to_string(folder.Path());
    } catch (...) {
      // Win32 / unpackaged fallback: %LOCALAPPDATA%\FocusFlow
      wchar_t buffer[MAX_PATH] = {};
      DWORD length = GetEnvironmentVariableW(L"LOCALAPPDATA", buffer, MAX_PATH);
      if (length == 0 || length >= MAX_PATH) {
        return ".";
      }

      std::filesystem::path dir =
          std::filesystem::path(buffer) / L"FocusFlow";
      std::error_code ec;
      std::filesystem::create_directories(dir, ec);
      return winrt::to_string(dir.wstring());
    }
#else
    return ".";
#endif
  }
};
