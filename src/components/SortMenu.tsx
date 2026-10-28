import { DropdownMenu } from 'radix-ui';
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  ArrowUp,
  ArrowDown,
  CalendarArrowUp,
  CalendarArrowDown,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { Sort } from '../lib/types.ts';
import type { Translate } from '../lib/i18n.ts';

export function SortMenu({
  value,
  onChange,
  t,
}: {
  value: Sort;
  onChange: (value: Sort) => void;
  t: Translate;
}) {
  const groups = [
    {
      label: t('name'),
      ascLabel: t('ascending'),
      descLabel: t('descending'),
      asc: 'name',
      desc: 'name-desc',
      ascending: <ArrowDownAZ />,
      descending: <ArrowDownZA />,
    },
    {
      label: t('volume'),
      ascLabel: t('smallest'),
      descLabel: t('largest'),
      asc: 'size-asc',
      desc: 'size',
      ascending: <ArrowDownNarrowWide />,
      descending: <ArrowDownWideNarrow />,
    },
    {
      label: t('time'),
      ascLabel: t('oldest'),
      descLabel: t('newest'),
      asc: 'date-asc',
      desc: 'date',
      ascending: <CalendarArrowUp />,
      descending: <CalendarArrowDown />,
    },
  ] as const;
  const selected = groups.find(
    (group) => group.asc === value || group.desc === value,
  )!;
  const ascending = selected.asc === value;
  const label = t('sortLabel')
    .replace('{field}', selected.label)
    .replace('{order}', ascending ? selected.ascLabel : selected.descLabel);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="text-button sort-trigger"
          type="button"
          aria-label={label}
        >
          {ascending ? selected.ascending : selected.descending}
          <span>{label}</span>
          <ChevronDown className="menu-chevron" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="menu radix-menu sort-menu"
          align="end"
          sideOffset={8}
          collisionPadding={10}
        >
          {groups.map((group) => (
            <DropdownMenu.Sub key={group.label}>
              <DropdownMenu.SubTrigger
                className="menu-option sort-category"
                data-selected={selected === group}
              >
                <span className="menu-icon" aria-hidden="true">
                  {selected === group && !ascending
                    ? group.descending
                    : group.ascending}
                </span>
                <span>{group.label}</span>
                <ChevronRight className="submenu-chevron" aria-hidden="true" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="menu radix-menu sort-submenu"
                  sideOffset={6}
                  collisionPadding={10}
                >
                  <DropdownMenu.RadioGroup
                    value={value}
                    onValueChange={(next) => onChange(next as Sort)}
                  >
                    {(
                      [
                        {
                          value: group.asc,
                          label: group.ascLabel,
                          icon: <ArrowUp />,
                        },
                        {
                          value: group.desc,
                          label: group.descLabel,
                          icon: <ArrowDown />,
                        },
                      ] as const
                    ).map((option) => (
                      <DropdownMenu.RadioItem
                        key={option.value}
                        value={option.value}
                        className="menu-option"
                      >
                        <span className="menu-icon" aria-hidden="true">
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                        <DropdownMenu.ItemIndicator className="menu-check">
                          <Check />
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
