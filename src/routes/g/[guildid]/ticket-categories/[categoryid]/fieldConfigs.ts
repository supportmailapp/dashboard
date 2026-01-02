import type { AnyAPIFormComponent, APIFormComponent, ModalComponentType } from "$lib/sm-types/src";
import { ComponentType } from "discord-api-types/v10";

type FormFieldConfig = {
  /**
   * Always given, except for:
   *
   * - Text Display
   */
  label?: boolean;
  /**
   * Not given for:
   *
   * - Text Display
   */
  description?: boolean;
  /**
   * Not given for:
   *
   * - Text Display
   * - File Upload
   */
  placeholder?: boolean;
  /**
   * Not given for:
   *
   * - Text Display
   */
  required?: boolean;
  /**
   * Not given for:
   *
   * - Text Display
   * - Text Input
   *
   * Note: If File Upload, this represents "Min Files" instead.
   */
  minValues?: boolean;
  /**
   * Not given for:
   *
   * - Text Display
   * - Text Input
   *
   * Note: If File Upload, this represents "Max Files" instead.
   */
  maxValues?: boolean;
  /**
   * Not given for:
   *
   * - Text Display (Even though it is given, it's just not displayed)
   */
  customId?: boolean;
  /**
   * Only given for:
   *
   * - Text Input
   */
  style?: boolean;
  /**
   * Only given for:
   *
   * - String Select
   * - User Select
   * - Role Select
   * - Channel Select
   * - Mentionable Select
   */
  options?: boolean;
  /**
   * Only given for:
   *
   * - Text Input
   */
  minLength?: boolean;
  /**
   * Only given for:
   *
   * - Text Input
   */
  maxLength?: boolean;
  /**
   * Only given for:
   *
   * - Text Input
   */
  defaultValue?: boolean;
  /**
   * Only given for:
   *
   * - Text Display
   */
  content?: boolean;
  /**
   * Only given for:
   *
   * - File Upload
   */
  messageLabel?: boolean;
};

export const configs: Record<ModalComponentType, FormFieldConfig> = {
  [ComponentType.TextDisplay]: {
    content: true,
  },
  [ComponentType.TextInput]: {
    label: true,
    description: true,
    placeholder: true,
    required: true,
    customId: true,
    style: true,
    minLength: true,
    maxLength: true,
    defaultValue: true,
  },
  [ComponentType.StringSelect]: {
    label: true,
    description: true,
    placeholder: true,
    required: true,
    customId: true,
    minValues: true,
    maxValues: true,
    options: true,
  },
  [ComponentType.File]: {
    label: true,
    description: true,
    required: true,
    messageLabel: true,
    minValues: true,
    maxValues: true,
  },
};

export function isFieldAllowed<T extends ModalComponentType = ModalComponentType>(
  field: AnyAPIFormComponent,
  configKey: keyof FormFieldConfig,
): field is APIFormComponent<T> {
  const config = configs[field.type];
  return Boolean(config[configKey]);
}
