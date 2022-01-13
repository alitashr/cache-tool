import uuid from "uuid";
// import testTree from "./testtree.json";

export const getPathOffile = (fileFullPath) => {
  const sp = fileFullPath.split("/");
  sp.pop();
  return "/" + sp.join("/");
}
const getParentFolder = fullpath => {
  const pathArray = fullpath.split("/").filter(a => a !== null && a !== "");
  return { parentFolder: pathArray[pathArray.length - 2], path: pathArray.slice(0, pathArray.length - 2).join("/") };
}
const isSimilarFile = (filePath, file) => {
  const { parentFolder, path } = getParentFolder(filePath);
  return file.label === parentFolder.substr(1) && getPathOffile(file.fullpath) === `/${path}`;
}
const partitionArray = (array, isValid) =>
  array.reduce(([pass, fail], elem) => {
    return isValid(elem) ? [[...pass, elem], fail] : [pass, [...fail, elem]];
  }, [[], []]);


export function arrangeIntoTree({ files, folders, defaultItemPath, setActiveItem = true }) {
  // Adapted from http://brandonclapp.com/arranging-an-array-of-flat-paths-into-a-json-tree-like-structure/

  //ignore RUGshared folder
  const filterRugshared = arr => arr.filter(item => !item.FullPath.split("/").includes("RUGShared"));
  files = filterRugshared(files);
  folders = filterRugshared(folders);

  //ignore files whose parents have "."" as first char
  const [notSimilarFiles, similarFiles] = partitionArray(files, item => getParentFolder(item.FullPath).parentFolder.charAt(0) !== ".");

  //ignore folders starting with . as first char
  folders = folders.filter(item => item.Name.charAt(0) !== ".");

  files = notSimilarFiles.map(item => {
    return {
      id: uuid.v4(),
      label: item.Name,
      fullpath: item.FullPath,
      path: getPathOffile(item.FullPath),
      isExpanded: false,
      childNodes: [],
      hasCaret: false,
      type: "file",
      similarItems: similarFiles.filter(s => isSimilarFile(s.FullPath, { fullpath: item.FullPath, label: item.Name })).map(item => {
        return {
          label: item.Name,
          fullpath: item.FullPath,
          path: getPathOffile(item.FullPath),
        }
      })
    };
  });
  let defaultItem;
  if (defaultItemPath)
    defaultItem = files.find(item => item.fullpath.toLowerCase() === defaultItemPath.toLowerCase());
  if (!defaultItem) {
    const rootFiles = files.filter(file => file.path === "/Designs")
    if (!rootFiles.length)
      defaultItem = files[0]
    else
      defaultItem = rootFiles[0]
    files = [...rootFiles, ...files.slice(0, files.length - rootFiles.length)]
  }
  let pathsArray = folders.map(path => path.FullPath.split("/"));
  let openNode;

  //eta bata recursively tree banauna suru hunxa
  let tree = [];
  pathsArray.forEach(path => {
    let currentLevel = tree;
    let fullpath = "";
    path.forEach((part, index) => {
      let existingPath = findWhere(currentLevel, "label", part);
      if (fullpath === "") {
        fullpath = part;
      } else {
        fullpath = fullpath + "/" + part;
      }
      if (existingPath) {
        currentLevel = existingPath.childNodes;
      } else {
        const fp = `/${fullpath}`;
        const designsInFolder = files.filter(item => item.path === fp)
        const isExpanded = defaultItem && defaultItem.path.split("/").includes(part.valueOf());
        const isSelected = setActiveItem && defaultItem && defaultItem.path === fp;
        let newPart = {
          id: uuid.v4(),
          label: part.valueOf(),
          fullpath: fp,
          isExpanded,
          isSelected,
          childNodes: [],
          hasCaret: true,
          type: "folder",
          filesInNode: designsInFolder,
          showThumbnails: designsInFolder.find(item => item.id === defaultItem.id),
          level: index,
          thumbsLength: 0
        };
        if (defaultItem && defaultItem.path === fp) {
          openNode = newPart;
        }
        currentLevel.push(newPart);
        currentLevel = newPart.childNodes;
      }
    });
  });
  if (defaultItemPath) {
    if (defaultItemPath.charAt(0) !== "/")
      defaultItemPath = `/${defaultItemPath}`
    const ftree = findItemNested(tree, defaultItemPath, "fullpath");
    if (ftree) {
      ftree.isExpanded = true;
      ftree.isSelected = true;
      ftree.showThumbnails = true;
      tree = [ftree]
      defaultItem = ftree.filesInNode[0]
      openNode = ftree
    }
  }

  return { tree, defaultItem, openNode, flatfileList: files };
}

function findWhere(array, key, value) {
  let t = 0;
  while (t < array.length && array[t][key] !== value) {
    t++;
  }
  if (t < array.length) {
    return array[t];
  } else {
    return false;
  }
}
export const findItemNested = (arr, itemId, key = "id", nestingKey = "childNodes") => {
  return arr.reduce((a, item) => {
    if (a) return a;
    if (item[key].toLowerCase() === itemId.toLowerCase()) return item;
    if (item[nestingKey])
      return findItemNested(item[nestingKey], itemId, key, nestingKey);
    return a
  }, null);
}

// export const findItemNested = (arr, itemId, key = "id", nestingKey = "childNodes") => {
//   // console.log(arr)
//   return arr.reduce((a, item) => {
//     if (a) return a;
//     if (item[key] === itemId) return item;
//     if (item[nestingKey])
//       return findItemNested(item[nestingKey], itemId, key, nestingKey);
//     return a
//   }, null);
// }
export const updateElementOfTree = (array, ids, key, value) => {
  const arr = [...array]
  arr.forEach(function iter(a) {
    if (ids.includes(a.id)) {
      a[key] = value;
    }
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr;
};
export const updateNode = (array, node) => {
  const arr = [...array]
  arr.forEach(function iter(a) {
    if (node.id === a.id) {
      a.filesInNode = node.filesInNode;
    }
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
};
export const updateSimilarFilesOfNode = (array, node) => {
  const arr = [...array]
  arr.forEach(function iter(a) {
    a.filesInNode.forEach(fileNode => {
      if (node.id === fileNode.id) {
        fileNode.similarItems = node.similarItems;
      }
    })
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
}
export const updateSingleFileProp = (array, node) => {
  const arr = [...array]
  arr.forEach(function iter(a) {
    a.filesInNode.forEach(fileNode => {
      if (node.id === fileNode.id) {
        fileNode.Thumb = node.Thumb;
        fileNode.Props = node.Props;
      }
    })
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
}
export const searchFiles = (arr, searchKey) => {
  let result = [];
  arr.forEach(function iter(a) {
    a.filesInNode.forEach(fileNode => {
      if (fileNode.label.toLowerCase().indexOf(searchKey.toLowerCase()) !== -1) result.push({ ...fileNode, parent: a })
    })
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return result;
}
export const expandTreeNode = (arr, node) => {
  arr.forEach(function iter(a, index) {
    a.isSelected = a.fullpath === node.fullpath;
    if (a.level >= node.level) {
      a.isExpanded = false;
    }
    a.showThumbnails = false;
    if (node.id === a.id) {
      a.isExpanded = true;
      a.showThumbnails = true;
    }
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
}
export const expandTreeNodeByPath = (arr, path) => {
  arr.forEach(function iter(a, index) {
    const isEqual = a.fullpath === path
    a.isSelected = isEqual
    a.isExpanded = isEqual
    a.showThumbnails = isEqual
    // if (a.level >= node.level) {
    //   a.isExpanded = false;
    // }
    // a.showThumbnails = false;
    // if (node.id === a.id) {
    //   a.isExpanded = true;
    //   a.showThumbnails = true;
    // }
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
}
export const updateEveryElementOfTree = (array, key, value) => {
  const arr = [...array]
  arr.forEach(function iter(a, index) {
    a[key] = value;
    Array.isArray(a.childNodes) && a.childNodes.forEach(iter);
  });
  return arr
};
export const findPrevNext = (array, node) => {
  const arr = [...array]
  let prev, next;
  arr.forEach(function iter(a, index, aParent) {
    a.filesInNode.forEach((fileInNode, i) => {
      if (node.id === fileInNode.id) {
        prev = a.filesInNode[i - 1]
        next = a.filesInNode[i + 1]
        if (i === 0) {// current node is the first item
          if (index === 0) {
            prev = node
          } else {
            const prevFolder = aParent.childNodes[index - 1];
            prev = prevFolder.filesInNode[prevFolder.filesInNode.length - 1] //last item of previous folder

          }
        }
        if (i >= a.filesInNode.length - 1) {//current node is the last item
          if (index >= aParent.childNodes.length - 1) {
            next = node
          } else {
            const nextFolder = aParent.childNodes[index + 1];
            // const nextFolder = a[index + 1];
            next = nextFolder.filesInNode[0]//first item of next folder

          }
        }
      }
    })
    Array.isArray(a.childNodes) && a.childNodes.forEach((x, i) => iter(x, i, a));
  });
  return { prev, next }
}
export const getSimilarDesigns = (designlist, design) => {
  const files = designlist.filter(item => item.Type === "file")
  const similarFiles = files.filter(s => isSimilarFile(s.FullPath, design)).map(item => {
    return {
      label: item.Name,
      fullpath: item.FullPath,
      path: getPathOffile(item.FullPath),
    }
  })
  return similarFiles
}