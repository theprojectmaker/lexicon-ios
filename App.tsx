import { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { theme } from './src/theme';
import { searchDictionary, searchEncyclopedia } from './src/search';
import { dictionary, encyclopedia } from './src/data';
import type { DictionaryEntry, EncyclopediaEntry } from './src/data';

type Screen = { kind: 'search' } | { kind: 'about' };
type Detail =
  | { type: 'word'; entry: DictionaryEntry }
  | { type: 'topic'; entry: EncyclopediaEntry }
  | null;

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'search' });
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<Detail>(null);

  const wordResults = useMemo(() => searchDictionary(query), [query]);
  const topicResults = useMemo(() => searchEncyclopedia(query), [query]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ExpoStatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.title}>Lexicon</Text>
          <Pressable
            onPress={() => setScreen(screen.kind === 'about' ? { kind: 'search' } : { kind: 'about' })}
            hitSlop={10}
          >
            <Text style={styles.headerLink}>{screen.kind === 'about' ? 'Close' : 'About'}</Text>
          </Pressable>
        </View>

        {screen.kind === 'about' ? (
          <AboutScreen />
        ) : detail ? (
          <DetailScreen detail={detail} onBack={() => setDetail(null)} />
        ) : (
          <>
            <View style={styles.searchBox}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Look up a word or topic…"
                placeholderTextColor={theme.inkSoft}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                clearButtonMode="while-editing"
              />
            </View>

            {query.trim().length === 0 ? (
              <EmptyState />
            ) : wordResults.length === 0 && topicResults.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No matches for “{query.trim()}”.</Text>
                <Text style={styles.emptySub}>
                  This is a fixed offline reference — about {dictionary.length.toLocaleString()} dictionary
                  words and {encyclopedia.length.toLocaleString()} encyclopedia topics. Not everything is
                  covered.
                </Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
                {topicResults.length > 0 && (
                  <ResultSection
                    label="ENCYCLOPEDIA"
                    color={theme.accentEncy}
                    items={topicResults.map((e) => ({
                      key: e.key,
                      title: e.title,
                      subtitle: e.summary,
                      onPress: () => setDetail({ type: 'topic', entry: e }),
                    }))}
                  />
                )}
                {wordResults.length > 0 && (
                  <ResultSection
                    label="DICTIONARY"
                    color={theme.accentDict}
                    items={wordResults.map((e) => ({
                      key: e.key,
                      title: e.word,
                      subtitle: e.definition,
                      onPress: () => setDetail({ type: 'word', entry: e }),
                    }))}
                  />
                )}
              </ScrollView>
            )}
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ResultSection({
  label,
  color,
  items,
}: {
  label: string;
  color: string;
  items: { key: string; title: string; subtitle: string; onPress: () => void }[];
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.resultRow} onPress={item.onPress}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={styles.resultTextWrap}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSubtitle} numberOfLines={2}>
              {item.subtitle}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function DetailScreen({ detail, onBack }: { detail: NonNullable<Detail>; onBack: () => void }) {
  const isWord = detail.type === 'word';
  const title = isWord ? detail.entry.word : detail.entry.title;
  const body = isWord ? detail.entry.definition : detail.entry.summary;
  const color = isWord ? theme.accentDict : theme.accentEncy;
  const label = isWord ? 'DICTIONARY DEFINITION' : 'ENCYCLOPEDIA ENTRY';
  const sourceNote = isWord
    ? "Webster's Revised Unabridged Dictionary (1913) — public domain"
    : 'Simple English Wikipedia — CC BY-SA 4.0';

  return (
    <ScrollView contentContainerStyle={styles.detail}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Text style={[styles.headerLink, { marginBottom: 16 }]}>‹ Back to results</Text>
      </Pressable>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
      <Text style={styles.detailTitle}>{title}</Text>
      <Text style={styles.detailBody}>{body}</Text>
      <Text style={styles.sourceNote}>{sourceNote}</Text>
    </ScrollView>
  );
}

function EmptyState() {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyBig}>📖</Text>
      <Text style={styles.emptyText}>Search a word or a topic.</Text>
      <Text style={styles.emptySub}>
        Works fully offline — {dictionary.length.toLocaleString()} dictionary words and{' '}
        {encyclopedia.length.toLocaleString()} encyclopedia topics, no internet needed.
      </Text>
    </View>
  );
}

function AboutScreen() {
  const open = (url: string) => Linking.openURL(url);
  return (
    <ScrollView contentContainerStyle={styles.about}>
      <Text style={styles.aboutHeading}>What's in Lexicon</Text>
      <Text style={styles.aboutPara}>
        Lexicon is a fully offline reference app. Everything you search is already on your device — there
        is no internet connection, account, or server involved, ever.
      </Text>

      <Text style={styles.aboutSubheading}>Dictionary</Text>
      <Text style={styles.aboutPara}>
        {dictionary.length.toLocaleString()} word definitions from{' '}
        <Text style={styles.bold}>Webster's Revised Unabridged Dictionary (1913)</Text>, via Project
        Gutenberg. This text is in the public domain. Because it's over a century old, spelling,
        phrasing, and some scientific terms are dated — and a few modern words simply aren't in it.
      </Text>

      <Text style={styles.aboutSubheading}>Encyclopedia</Text>
      <Text style={styles.aboutPara}>
        {encyclopedia.length.toLocaleString()} topic summaries adapted from{' '}
        <Text style={styles.bold}>Simple English Wikipedia</Text>, licensed under{' '}
        <Text style={styles.link} onPress={() => open('https://creativecommons.org/licenses/by-sa/4.0/')}>
          CC BY-SA 4.0
        </Text>
        . The topic list is drawn from Wikipedia's own community-curated "vital articles" lists (the
        subjects editors consider most important for any general encyclopedia to cover), limited to the
        ones that also exist on Simple Wikipedia. This is a curated subset for size — not the whole
        encyclopedia — so some topics won't be found.
      </Text>

      <Text style={styles.aboutSubheading}>Attribution</Text>
      <Text style={styles.aboutPara}>
        Encyclopedia content © Wikipedia contributors, CC BY-SA 4.0. See{' '}
        <Text
          style={styles.link}
          onPress={() => open('https://simple.wikipedia.org/wiki/Simple_English_Wikipedia:Copyrights')}
        >
          simple.wikipedia.org
        </Text>{' '}
        for full article histories and licensing details.
      </Text>

      <Text style={styles.aboutFooter}>Lexicon · {Platform.OS === 'ios' ? 'iOS' : 'app'} · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: theme.ink, letterSpacing: 0.2 },
  headerLink: { fontSize: 16, color: theme.accentEncy, fontWeight: '600' },
  searchBox: { paddingHorizontal: 20, paddingBottom: 8 },
  input: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.rule,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: theme.ink,
  },
  results: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginTop: 18 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  resultRow: { flexDirection: 'row', paddingVertical: 10, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, marginRight: 10 },
  resultTextWrap: { flex: 1 },
  resultTitle: { fontSize: 17, fontWeight: '600', color: theme.ink },
  resultSubtitle: { fontSize: 14, color: theme.inkSoft, marginTop: 2, lineHeight: 19 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  emptyBig: { fontSize: 44, marginBottom: 6 },
  emptyText: { fontSize: 17, fontWeight: '600', color: theme.ink, textAlign: 'center' },
  emptySub: { fontSize: 14, color: theme.inkSoft, textAlign: 'center', lineHeight: 20 },
  detail: { padding: 20, paddingBottom: 48 },
  detailTitle: { fontSize: 28, fontWeight: '700', color: theme.ink, marginBottom: 14 },
  detailBody: { fontSize: 17, color: theme.ink, lineHeight: 26 },
  sourceNote: { fontSize: 13, color: theme.inkSoft, marginTop: 20, fontStyle: 'italic' },
  about: { padding: 20, paddingBottom: 48 },
  aboutHeading: { fontSize: 24, fontWeight: '700', color: theme.ink, marginBottom: 10 },
  aboutSubheading: { fontSize: 17, fontWeight: '700', color: theme.ink, marginTop: 18, marginBottom: 6 },
  aboutPara: { fontSize: 15, color: theme.ink, lineHeight: 22 },
  bold: { fontWeight: '700' },
  link: { color: theme.accentEncy, textDecorationLine: 'underline' },
  aboutFooter: { fontSize: 13, color: theme.inkSoft, marginTop: 30 },
});
