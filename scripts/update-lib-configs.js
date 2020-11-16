/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const fs = require("fs")
const path = require("path")
const { CLIEngine } = require("eslint")
const { categories } = require("./rules")
const Root = path.resolve(__dirname, "../lib/configs")

function configNameToDisallowNewIn(revision) {
    const year = revision <= 5 ? revision : 2009 + revision
    return `no-new-in-es${year}`
}

function configNameToRestrictToPreviousOf(revision) {
    const prevRev = revision === 5 ? 3 : revision - 1
    const year = prevRev <= 5 ? prevRev : 2009 + prevRev
    return `restrict-to-es${year}`
}

function wrapCode(code) {
    return `/**
 * DON'T EDIT THIS FILE.
 * This file was generated by "scripts/update-lib-configs.js" script.
 */
"use strict"

module.exports = ${code}
`
}

for (const { noConfig, revision, rules } of Object.values(categories)) {
    if (noConfig) {
        continue
    }

    const ruleSetting = rules.map(r => `"es/${r.ruleId}":"error"`).join(",")
    const extendSetting = Object.values(categories)
        .filter(c => c.revision >= revision && !c.noConfig)
        .map(
            c => `require.resolve("./${configNameToDisallowNewIn(c.revision)}")`
        )
        .join(",")

    fs.writeFileSync(
        path.join(Root, `${configNameToDisallowNewIn(revision)}.js`),
        wrapCode(`{ rules: { ${ruleSetting} } }`)
    )
    fs.writeFileSync(
        path.join(Root, `${configNameToRestrictToPreviousOf(revision)}.js`),
        wrapCode(`{ extends: [${extendSetting}] }`)
    )
}

CLIEngine.outputFixes(
    new CLIEngine({ fix: true }).executeOnFiles(["lib/configs"])
)
