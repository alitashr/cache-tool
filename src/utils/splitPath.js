/**
 * The node posix path parser implemented in ES2015
 *
 * regex from: https://github.com/nodejs/node/blob/master/lib/path.js#L406
 *
 * @param  {String} path
 * @return {Object} result
 *
 * let { name } = parse('/foo/bar/baz.html')
 * // => name: baz
 */

const pattern = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

export const splitPath = (file = "") => {
  const [_, root = "", tempDir = "", base = "", ext = ""] = pattern.exec(file);
  const name = base.slice(0, base.length - ext.length);
  const dir = root + tempDir.slice(0, -1);
  return { name, dir, root, base, ext };
};
