// General Questionnaire helper functions
// (these should probably move into the sdc helpers npm package)
import {
  Questionnaire,
  QuestionnaireItem,
  QuestionnaireResponse,
  QuestionnaireResponseItem,
} from "fhir/r4";

/**
 * Scan through the provided questionnaire and replace the item with the provided patchItem based on a linkId match
 * @param questionnaire to scan through
 * @param patchItem item to replace the matching item with
 * @returns a new instance of the questionnaire with the identified item replaced
 */
export function PatchQuestionnaire(
  questionnaire: Questionnaire,
  patchItem: QuestionnaireItem
): Questionnaire {
  let result = {
    ...questionnaire,
    item: PatchQuestionnaireItem(questionnaire.item, patchItem),
  };
  return result;
}

function PatchQuestionnaireItem(
  item: QuestionnaireItem[] | undefined,
  patchItem: QuestionnaireItem
) {
  if (!item) return;
  let result = item.map((i) => {
    if (i.item) {
      i.item = PatchQuestionnaireItem(i.item, patchItem);
    }
    if (i.linkId === patchItem.linkId) {
      return patchItem;
    }
    return i;
  });
  return result;
}

export interface KeyedItem {
  [key: string]: KeyedItemValue;
}
export interface KeyedItemValue {
  itemDef: QuestionnaireItem;
  children?: KeyedItem;
  parent?: KeyedItemValue;
}

export function KeyQuestionnaire(questionnaire: Questionnaire): KeyedItem {
  return KeyQuestionnaireItem(questionnaire.item);
}

function KeyQuestionnaireItem(
  item: QuestionnaireItem[] | undefined,
  parent?: KeyedItemValue
): KeyedItem {
  if (!item) return {};

  let result: KeyedItem = {};
  item.map((i) => {
    let value: KeyedItemValue = { itemDef: i };
    if (parent) value.parent = parent;
    result[i.linkId] = value;
    if (i.item) {
      value.children = KeyQuestionnaireItem(i.item, value);
    }
  });
  return result;
}

export function findKeyedItem(
  qKeys: KeyedItem,
  linkId: string
): KeyedItemValue | undefined {
  if (qKeys.hasOwnProperty(linkId)) return qKeys[linkId];
  for (let key in qKeys) {
    let item = qKeys[key];
    if (item.children) {
      let found = findKeyedItem(item.children, linkId);
      if (found) return found;
    }
  }
}

/**
 * Create a new
 * @param questionnaire
 * @param response
 * @param patchItem
 * @returns
 */
export function PatchQuestionnaireResponse(
  questionnaire: Questionnaire,
  response: QuestionnaireResponse,
  patchItem: QuestionnaireResponseItem
): QuestionnaireResponse {
  let result = {
    ...response,
    item: PatchQuestionnaireResponseItem(
      questionnaire.item,
      response.item,
      patchItem
    ),
  };

  // patch in the correct canonical URL for the questionnaire
  // - some renderers get this wrong ;)   You know who you are :D
  result.questionnaire = questionnaire.url;
  if (questionnaire.version)
    result.questionnaire += `|${questionnaire.version}`;

  return result;
}

function PatchQuestionnaireResponseItem(
  itemDefs: QuestionnaireItem[] | undefined,
  items: QuestionnaireResponseItem[] | undefined,
  patchItem: QuestionnaireResponseItem
): QuestionnaireResponseItem[] | undefined {
  // if there are no definitions, this is the end of our search here.
  if (!itemDefs) return;

  if (!items || items.length === 0) {
    var itemDef = findItem(itemDefs, patchItem.linkId) as
      | QuestionnaireItem
      | undefined;
    if (itemDef) {
      // the item is in this part of the tree, so we will need to create the collection.
      let newItems: QuestionnaireResponseItem[] = [];
      if (itemDef.linkId === patchItem.linkId) {
        newItems.push(patchItem);
        return newItems;
      }
      // must be some child of the item
      itemDef.item?.map((i) => {
        if (i.linkId === patchItem.linkId) {
          newItems.push(patchItem);
          return patchItem;
        }
        // if (i.item) {
        //   // find the matching item definition
        //   var itemDef = findItem(itemDefs, i.linkId) as
        //     | QuestionnaireItem
        //     | undefined;
        //   if (itemDef)
        //     i.item = PatchQuestionnaireResponseItem(
        //       itemDef.item,
        //       i.item,
        //       patchItem
        //     );
        // }
        return i;
      });
      return newItems;
    } else {
      // the item is not in this part of the tree, so we can just bail here.
      return undefined;
    }
  }

  let found = false;
  let result = items.map((i) => {
    if (i.item) {
      // find the matching item definition
      var itemDef = findItem(itemDefs, i.linkId) as
        | QuestionnaireItem
        | undefined;
      if (itemDef)
        i.item = PatchQuestionnaireResponseItem(
          itemDef.item,
          i.item,
          patchItem
        );
      if (findItem(i.item, patchItem.linkId)) found = true;
    }
    if (i.linkId === patchItem.linkId) {
      found = true;
      return patchItem;
    }
    return i;
  });
  if (!found) {
    for (let itemDef of itemDefs) {
      if (itemDef.linkId == patchItem.linkId) {
        result.push(patchItem);
      } else {
        // must be a child of some item, find that
        if (findItem(itemDef.item, patchItem.linkId)) {
          // we found the item in the itemDef, so we need to create a new item in the response
          // and add it to the result.
          let newItem: QuestionnaireResponseItem = { linkId: itemDef.linkId, text: itemDef.text, item: []};
          PatchQuestionnaireResponseItem(itemDef.item, [], patchItem)
          result.push(newItem);
          console.log("patched in: ", itemDef.linkId);
        }
      }
    }
  }
  if (!found) {
    // the item is not in this part of the tree, so we can just bail here.
    console.log("Unable to find item in response: ", patchItem.linkId);
  }
  return result;
}

/**
 *  Recursively locate the item in the provided items (Q.item or QR.item)
 */
export function findItem(
  items: QuestionnaireItem[] | QuestionnaireResponseItem[] | undefined,
  linkId: string
): QuestionnaireItem | QuestionnaireResponseItem | undefined {
  if (!items) return;

  for (const i of items) {
    if (i.linkId == linkId) return i;
    if (i.item) {
      let found = findItem(i.item, linkId);
      if (found) return found;
    }
  }
  return undefined;
}
