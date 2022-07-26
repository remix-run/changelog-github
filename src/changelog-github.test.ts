import changelogFunctions from "./changelog-github";
import parse from "@changesets/parse";
import { describe, expect, it, test, vi } from "vitest";

const getReleaseLine = changelogFunctions.getReleaseLine;

const repo = "remix-run/remix-react";

const changes: ChangeData[] = [
  {
    commit: "a085003",
    user: "Andarist",
    pull: 1613,
    repo,
  },
  {
    commit: "b085003",
    user: "chaance",
    pull: null,
    repo,
  },
];

vi.mock(
  "@changesets/get-github-info",
  (): typeof import("@changesets/get-github-info") => {
    return {
      async getInfo({ commit, repo }) {
        let data = changes.find((c) => c.commit === commit);
        if (!data) {
          throw Error(`No commit found`);
        }
        expect(commit).toBe(data.commit);
        expect(repo).toBe(data.repo);
        return {
          pull: data.pull,
          user: data.user,
          links: {
            user: `[@${data.user}](https://github.com/${data.user})`,
            pull:
              data.pull != null
                ? `[#${data.pull}](https://github.com/${data.repo}/pull/${data.pull})`
                : null,
            commit: `[\`${data.commit}\`](https://github.com/${data.repo}/commit/${data.commit})`,
          },
        };
      },
      async getInfoFromPullRequest({ pull, repo }) {
        let data = changes.find((c) => c.pull === pull);
        if (!data) {
          throw Error(`No pull request found`);
        }
        expect(pull).toBe(data.pull);
        expect(repo).toBe(data.repo);
        return {
          commit: data.commit,
          user: data.user,
          links: {
            user: `[@${data.user}](https://github.com/${data.user})`,
            pull: `[#${data.pull}](https://github.com/${data.repo}/pull/${data.pull})`,
            commit: `[\`${data.commit}\`](https://github.com/${data.repo}/commit/${data.commit})`,
          },
        };
      },
    };
  }
);

function getChangeset(content: string, commit: string | undefined) {
  return [
    {
      ...parse(
        `---
  pkg: "minor"
  ---

  something
  ${content}
  `
      ),
      id: "some-id",
      commit,
    },
    "minor",
    { repo },
  ] as const;
}

let changeData = changes[0];
let changeDataWithoutPullRequest = changes[1];

describe.each([changeData.commit, "wrongcommit", undefined])(
  "with commit from changeset of %s",
  (commitFromChangeset) => {
    describe.each(["pr", "pull request", "pull"])(
      "override pr with %s keyword",
      (keyword) => {
        test.each(["with #", "without #"] as const)("%s", async (kind) => {
          expect(
            await getReleaseLine(
              ...getChangeset(
                `${keyword}: ${kind === "with #" ? "#" : ""}${changeData.pull}`,
                commitFromChangeset
              )
            )
          ).toEqual(
            `\n\n- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))\n`
          );
        });
      }
    );
    it("overrides commit with commit keyword", async () => {
      expect(
        await getReleaseLine(
          ...getChangeset(`commit: ${changeData.commit}`, commitFromChangeset)
        )
      ).toEqual(
        `\n\n- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))\n`
      );
    });
  }
);

test("with multiple authors", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        ["author: @Andarist", "author: @mitchellhamilton"].join("\n"),
        changeData.commit
      )
    )
  ).toMatchInlineSnapshot(`
    "

    - something ([#1613](https://github.com/remix-run/remix-react/pull/1613))
    "
  `);
});

test("change without a pull release", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @chaance", changeDataWithoutPullRequest.commit)
    )
  ).toMatchInlineSnapshot(`
    "

    - something ([\`b085003\`](https://github.com/remix-run/remix-react/commit/b085003))
    "
  `);
});

type ChangeData = {
  user: string;
  repo: string;
  commit: string;
  pull: number | null;
};
