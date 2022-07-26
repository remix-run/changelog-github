import { ChangelogFunctions } from "@changesets/types";
import { config } from "dotenv";
import { getInfo, getInfoFromPullRequest } from "@changesets/get-github-info";

config();

const changelogFunctions: ChangelogFunctions = {
  async getDependencyReleaseLine(changesets, dependenciesUpdated, options) {
    if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@remix-run/changelog-github", { "repo": "org/repo" }]'
      );
    }
    if (dependenciesUpdated.length === 0) {
      return "";
    }

    let changesetLink = `- Updated dependencies:`;
    let updatedDepenenciesList = dependenciesUpdated.map(
      (dependency) => `  - \`${dependency.name}@${dependency.newVersion}\``
    );
    return [changesetLink, ...updatedDepenenciesList].join("\n");
  },
  async getReleaseLine(changeset, type, options) {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@remix-run/changelog-github", { "repo": "org/repo" }]'
      );
    }

    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;

    let replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        let num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return "";
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return "";
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, () => "")
      .trim();

    let [firstLine, ...futureLines] = replacedChangelog
      .split("\n")
      .map((l) => l.trimRight());

    let { pull } = await (async () => {
      if (prFromSummary !== undefined) {
        let {
          links: { pull },
        } = await getInfoFromPullRequest({
          repo: options.repo,
          pull: prFromSummary,
        });
        return { pull };
      }
      let commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        let {
          links: { pull },
        } = await getInfo({
          repo: options.repo,
          commit: commitToFetchFrom,
        });
        return { pull };
      }
      return { pull: null };
    })();

    let postfix = pull == null ? "" : ` (${pull})`;
    return `\n\n- ${firstLine + (postfix ? postfix : "")}\n${futureLines
      .map((l) => `  ${l}`)
      .join("\n")}`;
  },
};

export default changelogFunctions;
