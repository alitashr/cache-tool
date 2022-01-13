export const defaultMatcher = (filterText, node) => {
  // if(node.filesInNode || node.filesInNode.length>0){

  // }
  return node.label.toLowerCase().indexOf(filterText.toLowerCase()) !== -1;
};

export const findNode = (node, filter, matcher) => {
  return (
    matcher(filter, node) || // i match
    (node.childNodes && // or i have decendents and one of them match
      node.childNodes.length &&
      !!node.childNodes.find(child => findNode(child, filter, matcher)))
  );
};

export const filterTree = (node, filter, matcher = defaultMatcher) => {
  // If im an exact match then all my childNodes get to stay
  if (matcher(filter, node) || !node.childNodes) {
    return node;
  }
  // If not then only keep the ones that match or have matching descendants
  const filtered = node.childNodes
    .filter(child => findNode(child, filter, matcher))
    .map(child => filterTree(child, filter, matcher));
  return Object.assign({}, node, { childNodes: filtered });
};

// export const expandFilteredNodes = (node, filter, matcher = defaultMatcher) => {
//   let childNodes = node.childNodes;
//   if (!childNodes || childNodes.length === 0) {
//     return Object.assign({}, node, { isExpanded: false });
//   }
//   const childNodesWithMatches = node.childNodes.filter(child => findNode(child, filter, matcher));
//   const shouldExpand = childNodesWithMatches.length > 0;
//   // If im going to expand, go through all the matches and see if thier childNodes need to expand
//   if (shouldExpand) {
//     childNodes = childNodesWithMatches.map(child => {
//       return expandFilteredNodes(child, filter, matcher);
//     });
//   }
//   return Object.assign({}, node, {
//     childNodes: childNodes,
//     isExpanded: shouldExpand,
//   });
// };
