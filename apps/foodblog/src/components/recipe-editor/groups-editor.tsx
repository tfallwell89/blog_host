'use client';

import { Button, Input, Textarea } from '@bloghost/ui';

import type { FieldErrors } from '@/lib/form';

import {
  emptyGroup,
  emptyItem,
  moveBy,
  removeAt,
  updateAt,
  type EditorGroup,
} from './editor-model';

export interface GroupsEditorLabels {
  heading: string;
  intro: string;
  groupTitleLabel: string;
  groupTitlePlaceholder: string;
  itemLabel: string;
  itemPlaceholder: string;
  addGroup: string;
  addItem: string;
  removeGroup: string;
  removeItem: string;
}

export interface GroupsEditorProps {
  groups: EditorGroup[];
  onChange: (groups: EditorGroup[]) => void;
  labels: GroupsEditorLabels;
  /** Numbered steps get an ordinal and a multi-line control. */
  ordered?: boolean;
  fieldErrors: FieldErrors | undefined;
  /** Root path used by server-side errors, e.g. `ingredientGroups`. */
  errorPrefix: string;
  /** Key of the nested collection, e.g. `ingredients` or `steps`. */
  itemsKey: string;
}

export function GroupsEditor({
  groups,
  onChange,
  labels,
  ordered = false,
  fieldErrors,
  errorPrefix,
  itemsKey,
}: GroupsEditorProps) {
  function itemError(groupIndex: number, itemIndex: number): string | undefined {
    return fieldErrors?.[`${errorPrefix}.${groupIndex}.${itemsKey}.${itemIndex}.text`];
  }

  function groupError(groupIndex: number): string | undefined {
    return (
      fieldErrors?.[`${errorPrefix}.${groupIndex}.title`] ??
      fieldErrors?.[`${errorPrefix}.${groupIndex}.${itemsKey}`]
    );
  }

  return (
    <section className="editor-section">
      <div className="editor-section__head">
        <h2 className="editor-section__title">{labels.heading}</h2>
        <p className="editor-section__intro">{labels.intro}</p>
      </div>

      {fieldErrors?.[errorPrefix] ? (
        <p className="ui-field__error" role="alert">
          {fieldErrors[errorPrefix]}
        </p>
      ) : null}

      <div className="group-list">
        {groups.map((group, groupIndex) => (
          <fieldset className="group-card" key={group.key}>
            <legend className="ui-visually-hidden">
              {labels.groupTitleLabel} {groupIndex + 1}
            </legend>

            <div className="group-card__head">
              <div className="group-card__title-field">
                <label className="ui-field__label" htmlFor={`${errorPrefix}-${group.key}-title`}>
                  {labels.groupTitleLabel}
                </label>
                <Input
                  id={`${errorPrefix}-${group.key}-title`}
                  value={group.title}
                  placeholder={labels.groupTitlePlaceholder}
                  invalid={Boolean(fieldErrors?.[`${errorPrefix}.${groupIndex}.title`])}
                  onChange={(event) =>
                    onChange(
                      updateAt(groups, groupIndex, (current) => ({
                        ...current,
                        title: event.target.value,
                      })),
                    )
                  }
                />
              </div>

              <div className="reorder">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${labels.groupTitleLabel.toLowerCase()} ${groupIndex + 1} up`}
                  disabled={groupIndex === 0}
                  onClick={() => onChange(moveBy(groups, groupIndex, -1))}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Move ${labels.groupTitleLabel.toLowerCase()} ${groupIndex + 1} down`}
                  disabled={groupIndex === groups.length - 1}
                  onClick={() => onChange(moveBy(groups, groupIndex, 1))}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={groups.length === 1}
                  onClick={() => onChange(removeAt(groups, groupIndex))}
                >
                  {labels.removeGroup}
                </Button>
              </div>
            </div>

            {groupError(groupIndex) ? (
              <p className="ui-field__error" role="alert">
                {groupError(groupIndex)}
              </p>
            ) : null}

            <ol className="item-list">
              {group.items.map((item, itemIndex) => {
                const error = itemError(groupIndex, itemIndex);
                const inputId = `${errorPrefix}-${group.key}-${item.key}`;

                return (
                  <li className="item-row" key={item.key}>
                    <span className="item-row__marker" aria-hidden="true">
                      {ordered ? itemIndex + 1 : '•'}
                    </span>

                    <div className="item-row__control">
                      <label className="ui-visually-hidden" htmlFor={inputId}>
                        {labels.itemLabel} {itemIndex + 1}
                      </label>
                      {ordered ? (
                        <Textarea
                          id={inputId}
                          value={item.text}
                          rows={2}
                          placeholder={labels.itemPlaceholder}
                          invalid={Boolean(error)}
                          onChange={(event) =>
                            onChange(
                              updateAt(groups, groupIndex, (current) => ({
                                ...current,
                                items: updateAt(current.items, itemIndex, (currentItem) => ({
                                  ...currentItem,
                                  text: event.target.value,
                                })),
                              })),
                            )
                          }
                        />
                      ) : (
                        <Input
                          id={inputId}
                          value={item.text}
                          placeholder={labels.itemPlaceholder}
                          invalid={Boolean(error)}
                          onChange={(event) =>
                            onChange(
                              updateAt(groups, groupIndex, (current) => ({
                                ...current,
                                items: updateAt(current.items, itemIndex, (currentItem) => ({
                                  ...currentItem,
                                  text: event.target.value,
                                })),
                              })),
                            )
                          }
                        />
                      )}
                      {error ? (
                        <p className="ui-field__error" role="alert">
                          {error}
                        </p>
                      ) : null}
                    </div>

                    <div className="reorder">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${labels.itemLabel.toLowerCase()} ${itemIndex + 1} up`}
                        disabled={itemIndex === 0}
                        onClick={() =>
                          onChange(
                            updateAt(groups, groupIndex, (current) => ({
                              ...current,
                              items: moveBy(current.items, itemIndex, -1),
                            })),
                          )
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${labels.itemLabel.toLowerCase()} ${itemIndex + 1} down`}
                        disabled={itemIndex === group.items.length - 1}
                        onClick={() =>
                          onChange(
                            updateAt(groups, groupIndex, (current) => ({
                              ...current,
                              items: moveBy(current.items, itemIndex, 1),
                            })),
                          )
                        }
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${labels.removeItem} ${itemIndex + 1}`}
                        disabled={group.items.length === 1}
                        onClick={() =>
                          onChange(
                            updateAt(groups, groupIndex, (current) => ({
                              ...current,
                              items: removeAt(current.items, itemIndex),
                            })),
                          )
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                onChange(
                  updateAt(groups, groupIndex, (current) => ({
                    ...current,
                    items: [...current.items, emptyItem()],
                  })),
                )
              }
            >
              {labels.addItem}
            </Button>
          </fieldset>
        ))}
      </div>

      <Button variant="secondary" onClick={() => onChange([...groups, emptyGroup()])}>
        {labels.addGroup}
      </Button>
    </section>
  );
}
