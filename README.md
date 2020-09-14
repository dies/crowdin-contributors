@awesome-crowdin/crowdin-contributors
========================

A CLI for automating the maintenance of your contributors table ✨

Automate acknowledging translators to your open source projects

<!-- toc -->
* [Usage](#usage)
* [Flags](#flags)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @awesome-crowdin/crowdin-contributors

$ crowdin-contributors
Downloading report...... ⢿

$ crowdin-contributors --help
...
```
<!-- usagestop -->
# Flags
$ crowdin-contributors -h
USAGE
  $ crowdin-contributors

OPTIONS
  -c, --contributorsPerLine=contributorsPerLine          [default: 7]
  -f, --file=file                                        [default: README.md] File name to write results to
  -f, --placeholderEnd=placeholderEnd                    [default: <!-- CROWDIN-TRANSLATORS-END -->] Placeholder end tag -f
  -f, --placeholderStart=placeholderStart                [default: <!-- CROWDIN-TRANSLATORS-START -->] Placeholder start tag -f
  -h, --help                                             show CLI help
  -m, --maxContributors=maxContributors                  [default: 30] Only -m contributors will be shown
  -m, --mimimumWordsContributed=mimimumWordsContributed  Minimum words contributed (both translated and approved)

  -o, --organization=organization                        Crowdin Organization (for Crowdin Enterprise only, leave empty for crowdin.com). CLI will check 
                                                         CROWDIN_ORGANIZATION environment variable if not set

  -p, --project=project                                  Crowdin project ID (number). CLI will check CROWDIN_PROJECT environment variable if not set

  -t, --token=token                                      Crowdin Token. CLI will check CROWDIN_TOKEN environment variable if not set

  -v, --version                                          show CLI version

DESCRIPTION
  Generate the list of Crowdin contributors
<!-- flags -->

<!-- commandsstop -->
