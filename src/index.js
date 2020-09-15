const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const crowdin = require('@crowdin/crowdin-api-client').default;
const axios = require('axios').default;
const fs = require('fs');

class OclifCrowdinContributorsCommand extends Command {
  async run() {
    const {flags} = this.parse(OclifCrowdinContributorsCommand)

    flags.project = flags.project || process.env.CROWDIN_PROJECT || await cli.prompt('What is the Crowdin project ID? (numeric value)');
    flags.organization = flags.organization || process.env.CROWDIN_ORGANIZATION || await cli.prompt('What is your Crowdin organization name? (type - if you\'re crowdin.com user)');
    flags.token = flags.token || process.env.CROWDIN_TOKEN || await cli.prompt('Crowdin Auth Token? (not the API key)', {type: 'hide'});

    if(flags.organization == "-") {
      flags.organization = "";
    }

    if (!fs.existsSync(flags.file)) {
        console.log("File " + flags.file + " does not exist");
        return;
    }

    getReport(flags);
  }
}

async function getReport(config) {
  const { reportsApi } = new crowdin({
      token: config.token,
      organization: config.organization
  });

  try {
      var report = await reportsApi.generateReport(config.project, {
          "name": "top-members",
          "schema": {
              "unit": "words",
              "format": "json",
              // "dateFrom": dateFrom,
              // "dateTo": dateTo
          }
      });
  } catch (e) {
      console.log(require('util').inspect(e, true, 8));
      return;
  }

  cli.action.start('Downloading report...');

  while (true) {
      try {
          var reportStatus = await reportsApi.checkReportStatus(config.project, report.data.identifier);

          if (reportStatus.data.status == "finished") {
              var reportJSON = await reportsApi.downloadReport(config.project, report.data.identifier);

              let results = await axios.get(reportJSON.data.url);

              prepareData(results, config);

              break;
          }
      } catch (e) {
          console.log(require('util').inspect(e, true, 8));
          cli.action.stop();
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
  }

  cli.action.stop();
}

async function prepareData(report, config) {
  var result = [],
      counter = 0;

  for (var i in report.data.data) {
      var user = report.data.data[i];

      if (counter >= config.maxContributors) {
          break;
      }

      if (user.user.username == "REMOVED_USER") {
          continue;
      }

      if (config.mimimumWordsContributed !== null && (user.translated + user.approved) < config.mimimumWordsContributed) {
          continue;
      }

      result.push({
          id: user.user.id,
          username: user.user.username,
          name: user.user.fullName,
          translated: user.translated,
          approved: user.approved
      });

      counter++;
  }

  const { usersApi } = new crowdin({
      token: config.token,
      organization: config.organization
  });

  const bar = cli.progress({
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    format: '||{bar} || {percentage}% ',
    fps: 100,
    stream: process.stdout,
    barsize: 30,
  });

  bar.start(config.maxContributors, 0);

  for (var i in result) {
      try {
          var crowdinMember = await usersApi.getMemberInfo(config.project, result[i].id);
          result[i].picture = crowdinMember.data.avatarUrl;
      } catch (e) {
          //the account might be private, that produces 404 exception
          result[i].picture = "https://i2.wp.com/crowdin.com/images/user-picture.png?ssl=1";
      }

      bar.increment();
  }

  bar.stop();

  renderReport(result, config);
}

async function renderReport(report, config) {
  var result = [],
      html = "",
      tda = "";

  for (let i = 0; i < report.length; i += config.contributorsPerLine) {
      result.push(report.slice(i, i + config.contributorsPerLine));
  }

  html = `<table style="width: 100%;">`;

  for (var i in result) {
      html += "<tr>";
      for (var j in result[i]) {
          if(!config.organization) {
            tda = `<a href="https://crowdin.com/profile/` + result[i][j].username + `">
                    <img style="width: 58px" src="` + result[i][j].picture + `"/>
                   </a>`;
          } else {
            tda = `<img style="width: 58px" src="` + result[i][j].picture + `"/>`;
          }

          html += `
              <td style="text-align:center; vertical-align: top;">
                  ` + tda + `
                  <br />
                  <sub>
                      <b>` + result[i][j].name + `</b>
                  </sub>
                  <br />
                  <sub>
                      <b>` + (result[i][j].translated + result[i][j].approved) + ` words</b>
                  </sub>
              </td>`;
      }
      html += "</tr>";
  }
  html += "</table>";

  console.log("Writing result to ", config.file);

  var fileContents = fs.readFileSync(config.file);

  if(fileContents.indexOf(config.placeholderStart) === -1 || fileContents.indexOf(config.placeholderEnd) === -1) {
    console.log("Unable to locate start or end tag in " + config.file);
    return;
  }

  var sliceFrom = fileContents.indexOf(config.placeholderStart) + config.placeholderStart.length;
  var sliceTo = fileContents.indexOf(config.placeholderEnd);

  fileContents = fileContents.slice(0, sliceFrom) + "\r\n" + html + "\r\n" + fileContents.slice(sliceTo);

  fs.writeFileSync(config.file, fileContents);
}

OclifCrowdinContributorsCommand.description = `
Generate the list of Crowdin contributors
`

OclifCrowdinContributorsCommand.flags = {
  version: flags.version({char: 'v'}),
  help: flags.help({char: 'h'}),
  project: flags.integer({char: 'p', description: 'Crowdin project ID (number). CLI will check CROWDIN_PROJECT environment variable if not set'}),
  token: flags.string({char: 't', description: 'Crowdin Token. CLI will check CROWDIN_TOKEN environment variable if not set'}),
  organization: flags.string({char: 'o', description: 'Crowdin Organization (for Crowdin Enterprise only, leave empty for crowdin.com). CLI will check CROWDIN_ORGANIZATION environment variable if not set'}),
  maxContributors: flags.string({char: 'm', description: 'Only -m contributors will be shown', default: 30}),
  file: flags.string({char: 'f', description: 'File name to write results to', default: "README.md"}),
  placeholderStart: flags.string({char: 'f', description: 'Placeholder start tag -f', default: "<!-- CROWDIN-TRANSLATORS-START -->"}),
  placeholderEnd: flags.string({char: 'f', description: 'Placeholder end tag -f', default: "<!-- CROWDIN-TRANSLATORS-END -->"}),
  contributorsPerLine: flags.integer({char: 'c', default: 7}),
  mimimumWordsContributed: flags.integer({char: 'mwc', description: 'Minimum words contributed (both translated and approved)', default: null}),
}

module.exports = OclifCrowdinContributorsCommand
