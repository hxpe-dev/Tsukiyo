import React, {useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';
import {useTheme} from '../context/ThemeContext';
import { Extension } from '../types/extensions';
import { clearExtensions, deleteExtension, listInstalledExtensions } from '../utils/extensions';
import Icon from 'react-native-vector-icons/Feather';

const EXTENSIONS_DIR = `${RNFS.DocumentDirectoryPath}/extensions`;
const EXTENSIONS_STORE = `${EXTENSIONS_DIR}/installed.json`;

export default function SourcesScreen() {
  const {theme} = useTheme();
  const styles = useThemedStyles(theme);

  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  useEffect(() => {
    loadInstalledExtensions();
  }, []);

  const loadInstalledExtensions = async () => {
    const list = await listInstalledExtensions();
    setExtensions(list);
  };

  const toRawGitHubUrl = (url: string) =>
    url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');

  const installExtension = async (url: string) => {
    try {
      setLoading(true);
      // const rawUrl = toRawGitHubUrl(url.trim());
      // For testing purposes
      const rawUrl = 'https://raw.githubusercontent.com/hxpe-dev/TsukiyoExtensions/refs/heads/main/mangadex.js';
      const fileName = rawUrl.split('/').pop();
      if (!fileName) {
        throw new Error('Invalid filename');
      }

      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const slug = `${baseName}-${Date.now()}`;
      const filePath = `${EXTENSIONS_DIR}/${slug}.js`;

      const download = await RNFS.downloadFile({
        fromUrl: rawUrl,
        toFile: filePath,
      }).promise;

      if (download.statusCode !== 200) {
        throw new Error('Download failed');
      }

      const code = await RNFS.readFile(filePath, 'utf8');
//       const code = `const BASE_URL = 'https://api.mangadex.org';

// let isRateLimited = false;
// let rateLimitResetTime = 0;

// function buildUrl(endpoint, params) {
//   let query = '';
//   if (params) {
//     query = Object.entries(params)
//       .flatMap(function ([key, value]) {
//         if (Array.isArray(value)) {
//           return value.map(function (v) {
//             return encodeURIComponent(key) + '[]=' + encodeURIComponent(v);
//           });
//         } else if (typeof value === 'object' && value !== null) {
//           return Object.entries(value).map(function ([nestedKey, nestedValue]) {
//             if (['string', 'number', 'boolean'].indexOf(typeof nestedValue) !== -1) {
//               return encodeURIComponent(key + '[' + nestedKey + ']') + '=' + encodeURIComponent(nestedValue);
//             }
//             return '';
//           });
//         } else {
//           return [encodeURIComponent(key) + '=' + encodeURIComponent(value)];
//         }
//       })
//       .join('&');
//   }
//   return BASE_URL + endpoint + (query ? '?' + query : '');
// }

// function fetchFromApi(endpoint, params, urlAddon) {
//   if (urlAddon === undefined) urlAddon = '';
//   var now = Date.now();
//   if (isRateLimited && now < rateLimitResetTime) {
//     return Promise.reject(new Error('RATE_LIMITED'));
//   }

//   var url = buildUrl(endpoint, params);
//   return fetch(url + urlAddon).then(function (response) {
//     if (response.status === 429) {
//       isRateLimited = true;
//       rateLimitResetTime = Date.now() + 60 * 1000;
//       return Promise.reject(new Error('RATE_LIMITED'));
//     }
//     if (!response.ok) {
//       return Promise.reject(new Error('API Error: ' + response.status));
//     }
//     return response.json();
//   });
// }

// function fetchMangaDetails (mangaId) {
//   return fetchFromApi('/manga/' + mangaId, {
//     includes: ['cover_art'],
//   }).then(function (data) {
//     var manga = data.data;
//     if (!manga) return null;

//     var coverRel = (manga.relationships || []).find(function (rel) {
//       return rel.type === 'cover_art';
//     });
//     if (!coverRel) return manga;

//     return fetchFromApi('/cover/' + coverRel.id)
//       .then(function (coverData) {
//         var fileName = coverData && coverData.data && coverData.data.attributes && coverData.data.attributes.fileName;
//         var extended = Object.assign({}, manga);
//         extended.coverFileName = fileName;
//         return extended;
//       })
//       .catch(function () {
//         return manga;
//       });
//   });
// }

// function fetchChapterList (mangaId, options) {
//   if (!options) options = {};
//   var language = options.language || 'en';
//   var page = options.page || 1;
//   var limit = options.limit || 100;

//   return fetchFromApi('/manga/' + mangaId + '/feed', {
//     translatedLanguage: [language],
//     order: { chapter: 'asc' },
//     limit: limit,
//     offset: (page - 1) * limit,
//   }).then(function (data) {
//     return data.data || [];
//   });
// }

// globalThis.extension = {
//   id: 'mangadex-extension',
//   name: 'Mangadex',
//   version: '1.0.0',

//   search: function (query, options) {
//     if (!options) options = {};
//     var limit = options.limit !== undefined ? options.limit : 10;
//     var plusEighteen = options.plusEighteen !== undefined ? options.plusEighteen : true;
//     var order = options.order !== undefined ? options.order : { relevance: 'desc' };

//     return fetchFromApi(
//       '/manga',
//       {
//         title: query,
//         limit: limit,
//         order: order,
//         contentRating: plusEighteen ? [] : ['safe', 'suggestive'],
//         includes: ['cover_art'],
//       },
//       '?_=' + Date.now()
//     ).then(function (data) {
//       var mangaList = data.data || [];

//       var enrichedPromises = mangaList.map(function (manga) {
//         var coverRel = (manga.relationships || []).find(function (rel) {
//           return rel.type === 'cover_art';
//         });
//         if (!coverRel) {
//           return Promise.resolve(manga);
//         }
//         return fetchFromApi('/cover/' + coverRel.id)
//           .then(function (coverData) {
//             var fileName = coverData && coverData.data && coverData.data.attributes && coverData.data.attributes.fileName;
//             var extended = Object.assign({}, manga);
//             extended.coverFileName = fileName;
//             return extended;
//           })
//           .catch(function () {
//             return manga;
//           });
//       });

//       return Promise.all(enrichedPromises);
//     });
//   },

//   explorer: function (limit, plusEighteen) {
//     if (limit === undefined) limit = 10;
//     if (plusEighteen === undefined) plusEighteen = true;

//     var latestMangaPromise = globalThis.extension.search('', {
//       limit: limit,
//       plusEighteen: plusEighteen,
//       order: { latestUploadedChapter: 'desc' },
//     }).catch(function () {
//       return [];
//     });

//     var mostFollowedMangaPromise = globalThis.extension.search('', {
//       limit: limit,
//       plusEighteen: plusEighteen,
//       order: { followedCount: 'desc' },
//     }).catch(function () {
//       return [];
//     });

//     return Promise.all([latestMangaPromise, mostFollowedMangaPromise]).then(function ([latest, mostFollowed]) {
//       return {
//         'Latest Manga': latest,
//         'Most Followed Manga': mostFollowed,
//       };
//     });
//   },

//   informations: function (mangaId, options) {
//     var detailsPromise = fetchMangaDetails(mangaId).catch(function () {
//       return null;
//     });

//     var chaptersPromise = fetchChapterList(mangaId, options).catch(function () {
//       return [];
//     });

//     return Promise.all([detailsPromise, chaptersPromise]).then(function ([details, chapters]) {
//       return {
//         details: details,
//         chapters: chapters,
//       };
//     });
//   },

//   reader: function (chapterId) {
//     return fetchFromApi('/at-home/server/' + chapterId).then(function (data) {
//       var baseUrl = data.baseUrl;
//       var chapter = data.chapter;
//       if (!chapter || !chapter.data || !baseUrl) return [];

//       return chapter.data.map(function (filename) {
//         return baseUrl + '/data/' + chapter.hash + '/' + filename;
//       });
//     });
//   },

//   isApiRateLimited: function () {
//     return isRateLimited;
//   },


//   // fetchCoverFileName: function (coverId) {
//   //   return fetchFromApi('/cover/' + coverId)
//   //     .then(function (coverData) {
//   //       return (coverData && coverData.data && coverData.data.attributes && coverData.data.attributes.fileName) || null;
//   //     })
//   //     .catch(function () {
//   //       return null;
//   //     });
//   // },
// };
// `;
      // eslint-disable-next-line no-new-func
      const factory = new Function('module', 'exports', code);
      const exports: any = {};
      const module = { exports };
      factory(module, exports);

      const ext = (globalThis as any).extension;

      if (!validateExtension(ext)) {
        await RNFS.unlink(filePath);
        throw new Error('Extension does not follow required format.');
      }

      const extensionMeta: Extension = {
        id: ext.id,
        name: ext.name,
        version: ext.version || '1.0.0',
        filePath,
      };

      const newList = [...extensions, extensionMeta];
      await RNFS.writeFile(
        EXTENSIONS_STORE,
        JSON.stringify(newList, null, 2),
        'utf8',
      );
      setExtensions(newList);
      Alert.alert('Installed', `Extension "${ext.name}" installed.`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to install extension');
    } finally {
      setLoading(false);
      setModalVisible(false);
      setGithubUrl('');
    }
  };

  const validateExtension = (ext: any) =>
    ext &&
    typeof ext.id === 'string' &&
    typeof ext.name === 'string' &&
    typeof ext.search === 'function' &&
    typeof ext.explorer === 'function' &&
    typeof ext.informations === 'function' &&
    typeof ext.chapters === 'function' &&
    typeof ext.reader === 'function' &&
    typeof ext.isApiRateLimited === 'function';

  const clearAllExtensions = async () => {
    try {
      await clearExtensions();
      setExtensions([]);
      Alert.alert('Success', 'All extensions have been removed.');
    } catch (err) {
      console.error('Error clearing extensions:', err);
      Alert.alert('Error', 'Failed to clear extensions.');
    }
  };

  const renderItem = ({item}: {item: Extension}) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subText}>ID: {item.id}</Text>
      <Text style={styles.subText}>Version: {item.version}</Text>
      <TouchableOpacity onPress={() => deleteExtension(item.id)}>
        <Icon name="trash-2" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color={theme.button} />
        ) : (
          <Text style={styles.buttonText}>Add Source</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        // eslint-disable-next-line react-native/no-inline-styles
        style={[styles.button, { marginTop: 10 }, loading && styles.buttonDisabled]}
        onPress={clearAllExtensions}
        disabled={loading}>
        <Text style={styles.buttonText}>Clear All Extensions</Text>
      </TouchableOpacity>

      <FlatList
        // eslint-disable-next-line react-native/no-inline-styles
        style={{marginTop: 20}}
        data={extensions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No extensions installed.</Text>
        }
      />

      {/* Modal for GitHub URL input */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!loading) {
            setModalVisible(false);
            setGithubUrl('');
          }
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Enter GitHub file URL (raw or repo):
            </Text>
            <TextInput
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="https://github.com/..."
              style={styles.input}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: theme.error}]}
                onPress={() => {
                  if (!loading) {
                    setModalVisible(false);
                    setGithubUrl('');
                  }
                }}
                disabled={loading}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, {backgroundColor: theme.button}]}
                onPress={() => installExtension(githubUrl)}
                disabled={loading || !githubUrl.trim()}>
                {loading ? (
                  <ActivityIndicator color={theme.button} />
                ) : (
                  <Text style={styles.buttonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useThemedStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.elevatedBackground,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
    },
    title: {
      fontWeight: 'bold',
      fontSize: 16,
      marginBottom: 4,
      color: theme.text,
    },
    subText: {
      color: theme.textSecondary,
    },
    button: {
      backgroundColor: theme.button,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    emptyText: {
      marginTop: 30,
      textAlign: 'center',
      color: theme.text,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: theme.lowOpacity,
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.background,
      padding: 20,
      borderRadius: 8,
    },
    modalTitle: {
      color: theme.text,
    },
    input: {
      borderBottomWidth: 1,
      borderColor: theme.text,
      marginBottom: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      fontSize: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      padding: 12,
      marginHorizontal: 5,
      borderRadius: 6,
      alignItems: 'center',
    },
  });
