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
  {
    commit: "c085003",
    user: "chaance",
    pull: 1618,
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

function getChangeset(
  message: string,
  content: string,
  commit: string | undefined
) {
  return [
    {
      ...parse(
        `---
  pkg: "minor"
  ---

  ${message}
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
                "something",
                `${keyword}: ${kind === "with #" ? "#" : ""}${changeData.pull}`,
                commitFromChangeset
              )
            )
          ).toEqual(
            `- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))`
          );
        });
      }
    );
    it("overrides commit with commit keyword", async () => {
      expect(
        await getReleaseLine(
          ...getChangeset(
            "something",
            `commit: ${changeData.commit}`,
            commitFromChangeset
          )
        )
      ).toEqual(
        `- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))`
      );
    });
  }
);

test("with multiple authors", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        "something",
        ["author: @Andarist", "author: @mitchellhamilton"].join("\n"),
        changeData.commit
      )
    )
  ).toMatchInlineSnapshot(
    '"- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))"'
  );
});

test("change without a pull release", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        "something",
        "author: @chaance",
        changeDataWithoutPullRequest.commit
      )
    )
  ).toMatchInlineSnapshot(
    '"- something ([`b085003`](https://github.com/remix-run/remix-react/commit/b085003))"'
  );
});

test("with multiple changesets", async () => {
  let lines = await Promise.all([
    getReleaseLine(
      ...getChangeset("something", "author: @Andarist", changeData.commit)
    ),
    getReleaseLine(
      ...getChangeset(
        "something else",
        "author: @chaance",
        changeDataWithoutPullRequest.commit
      )
    ),
    getReleaseLine(
      ...getChangeset(
        "and one more thing",
        "author: @chaance",
        changes[2].commit
      )
    ),
  ]);

  expect(lines.join("\n")).toMatchInlineSnapshot(`
    "- something ([#1613](https://github.com/remix-run/remix-react/pull/1613))
    - something else ([\`b085003\`](https://github.com/remix-run/remix-react/commit/b085003))
    - and one more thing ([#1618](https://github.com/remix-run/remix-react/pull/1618))"
  `);
});

type ChangeData = {
  user: string;
  repo: string;
  commit: string;
  pull: number | null;
};
