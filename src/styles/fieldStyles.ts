/**
 * Comprehensive styling system for inspection form field components
 * Provides consistent styling, responsive design, and accessibility features
 */

// Base field styling classes
export const fieldStyles = {
  // Container classes
  container: {
    base: 'field-component relative',
    spacing: 'space-y-2',
    responsive: 'w-full',
  },

  // Input wrapper classes
  wrapper: {
    base: 'relative',
    withIcon: 'relative',
    withControls: 'relative flex',
  },

  // Base input styling
  input: {
    base: `
      w-full px-3 py-2 border rounded-lg text-sm
      transition-all duration-200 ease-in-out
      placeholder:text-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200
    `,
    withLeftIcon: 'pl-10',
    withRightIcon: 'pr-10',
    withControls: 'pr-16',
    sizes: {
      sm: 'px-2 py-1.5 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    },
  },

  // State-based styling
  states: {
    default: 'border-gray-300 bg-white text-gray-900',
    focused: 'ring-2 ring-blue-500 ring-opacity-20 border-blue-500',
    error: 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500',
    success: 'border-green-300 bg-green-50',
    disabled: 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200',
    readonly: 'bg-gray-100 cursor-default',
  },

  // Icon positioning
  icons: {
    left: 'absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none',
    right: 'absolute inset-y-0 right-0 flex items-center pr-3',
    size: 'h-4 w-4',
    colors: {
      default: 'text-gray-500',
      disabled: 'text-gray-400',
      error: 'text-red-500',
      success: 'text-green-500',
    },
  },

  // Label styling
  label: {
    base: 'block text-sm font-medium text-gray-700 mb-1',
    required: 'after:content-["*"] after:text-red-500 after:ml-1',
    disabled: 'text-gray-400',
    error: 'text-red-700',
  },

  // Help text styling
  helpText: {
    base: 'mt-1 text-sm text-gray-500',
    error: 'text-red-600',
  },

  // Error message styling
  error: {
    base: 'mt-1 flex items-center gap-1 text-sm text-red-600',
    icon: 'h-4 w-4 flex-shrink-0',
    animation: 'animate-in slide-in-from-top-1 duration-200',
  },

  // Character count styling
  characterCount: {
    base: 'mt-1 text-xs text-right',
    normal: 'text-gray-400',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  },

  // Button styling for controls
  button: {
    base: `
      inline-flex items-center justify-center
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    sizes: {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    },
    variants: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
      outline: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
    },
  },

  // Checkbox and radio styling
  checkbox: {
    base: `
      h-4 w-4 rounded border-gray-300 text-blue-600
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
      transition-colors duration-200
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    error: 'border-red-300 text-red-600 focus:ring-red-500',
  },

  radio: {
    base: `
      h-4 w-4 border-gray-300 text-blue-600
      focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
      transition-colors duration-200
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    error: 'border-red-300 text-red-600 focus:ring-red-500',
  },

  // Toggle switch styling
  toggle: {
    base: `
      relative inline-flex h-6 w-11 items-center rounded-full
      transition-colors duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    track: {
      off: 'bg-gray-200',
      on: 'bg-blue-600',
      error: 'bg-red-600',
    },
    thumb: `
      inline-block h-4 w-4 transform rounded-full bg-white
      transition-transform duration-200 ease-in-out
    `,
    thumbPosition: {
      off: 'translate-x-1',
      on: 'translate-x-6',
    },
  },

  // Select dropdown styling
  select: {
    dropdown: `
      absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg
      max-h-60 overflow-hidden
    `,
    option: `
      w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer
      hover:bg-gray-50 focus:bg-blue-50 focus:outline-none
    `,
    optionSelected: 'bg-blue-100 text-blue-900',
    optionFocused: 'bg-blue-50',
    search: `
      w-full px-3 py-2 border-b border-gray-200
      focus:outline-none focus:ring-1 focus:ring-blue-500
    `,
  },

  // Multi-select styling
  multiSelect: {
    container: 'space-y-3',
    option: `
      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
      transition-all duration-200
      hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500
    `,
    optionSelected: 'border-blue-300 bg-blue-50',
    optionError: 'border-red-300 bg-red-50',
    selectAll: 'mb-4 pb-3 border-b border-gray-200',
    summary: 'mt-2 p-2 bg-gray-50 rounded text-sm',
  },

  // Form section styling
  section: {
    container: 'border border-gray-200 rounded-lg p-6 space-y-6',
    header: 'text-lg font-medium text-gray-900 mb-4',
    description: 'text-gray-600 text-sm mb-4',
  },

  // Responsive breakpoints
  responsive: {
    mobile: 'sm:',
    tablet: 'md:',
    desktop: 'lg:',
    wide: 'xl:',
  },

  // Animation classes
  animations: {
    fadeIn: 'animate-in fade-in duration-200',
    slideIn: 'animate-in slide-in-from-top-1 duration-200',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    shake: 'animate-pulse',
  },

  // Accessibility classes
  accessibility: {
    screenReaderOnly: 'sr-only',
    focusVisible: 'focus-visible:ring-2 focus-visible:ring-blue-500',
    highContrast: 'contrast-more:border-black contrast-more:text-black',
  },
};

// Utility functions for dynamic styling
export const getInputClassName = (options: {
  hasError?: boolean;
  isDisabled?: boolean;
  isFocused?: boolean;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
  hasControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const {
    hasError = false,
    isDisabled = false,
    isFocused = false,
    hasLeftIcon = false,
    hasRightIcon = false,
    hasControls = false,
    size = 'md',
  } = options;

  let className = fieldStyles.input.base;

  // Add size
  className += ` ${fieldStyles.input.sizes[size]}`;

  // Add icon spacing
  if (hasLeftIcon) className += ` ${fieldStyles.input.withLeftIcon}`;
  if (hasRightIcon) className += ` ${fieldStyles.input.withRightIcon}`;
  if (hasControls) className += ` ${fieldStyles.input.withControls}`;

  // Add state classes
  if (isDisabled) {
    className += ` ${fieldStyles.states.disabled}`;
  } else if (hasError) {
    className += ` ${fieldStyles.states.error}`;
  } else {
    className += ` ${fieldStyles.states.default}`;
  }

  if (isFocused && !isDisabled) {
    className += ` ${fieldStyles.states.focused}`;
  }

  return className.trim();
};

export const getIconClassName = (options: {
  position: 'left' | 'right';
  isDisabled?: boolean;
  hasError?: boolean;
  isSuccess?: boolean;
}) => {
  const { position, isDisabled = false, hasError = false, isSuccess = false } = options;

  let className = fieldStyles.icons[position] + ` ${fieldStyles.icons.size}`;

  if (isDisabled) {
    className += ` ${fieldStyles.icons.colors.disabled}`;
  } else if (hasError) {
    className += ` ${fieldStyles.icons.colors.error}`;
  } else if (isSuccess) {
    className += ` ${fieldStyles.icons.colors.success}`;
  } else {
    className += ` ${fieldStyles.icons.colors.default}`;
  }

  return className.trim();
};

export const getLabelClassName = (options: {
  isRequired?: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
}) => {
  const { isRequired = false, isDisabled = false, hasError = false } = options;

  let className = fieldStyles.label.base;

  if (isRequired) className += ` ${fieldStyles.label.required}`;
  if (isDisabled) className += ` ${fieldStyles.label.disabled}`;
  if (hasError) className += ` ${fieldStyles.label.error}`;

  return className.trim();
};

export const getCharacterCountClassName = (options: {
  current: number;
  max: number;
  warningThreshold?: number;
}) => {
  const { current, max, warningThreshold = 0.9 } = options;

  let className = fieldStyles.characterCount.base;

  if (current >= max) {
    className += ` ${fieldStyles.characterCount.danger}`;
  } else if (current >= max * warningThreshold) {
    className += ` ${fieldStyles.characterCount.warning}`;
  } else {
    className += ` ${fieldStyles.characterCount.normal}`;
  }

  return className.trim();
};

// Responsive design utilities
export const getResponsiveClassName = (baseClass: string, breakpoints?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  wide?: string;
}) => {
  let className = baseClass;

  if (breakpoints?.mobile) {
    className += ` ${fieldStyles.responsive.mobile}${breakpoints.mobile}`;
  }
  if (breakpoints?.tablet) {
    className += ` ${fieldStyles.responsive.tablet}${breakpoints.tablet}`;
  }
  if (breakpoints?.desktop) {
    className += ` ${fieldStyles.responsive.desktop}${breakpoints.desktop}`;
  }
  if (breakpoints?.wide) {
    className += ` ${fieldStyles.responsive.wide}${breakpoints.wide}`;
  }

  return className.trim();
};

// Form layout utilities
export const getFieldLayoutClassName = (layout: 'full' | 'half' | 'third' | 'quarter' = 'full') => {
  const layouts = {
    full: 'w-full',
    half: 'w-full md:w-1/2',
    third: 'w-full md:w-1/3',
    quarter: 'w-full md:w-1/4',
  };

  return layouts[layout] || layouts.full;
};

// Accessibility helpers
export const getAccessibilityProps = (options: {
  fieldId: string;
  hasError?: boolean;
  hasHelp?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
}) => {
  const { fieldId, hasError = false, hasHelp = false, isRequired = false, isDisabled = false } = options;

  const props: Record<string, string | boolean> = {
    id: `field-${fieldId}`,
    'aria-labelledby': `label-${fieldId}`,
  };

  if (hasHelp) {
    props['aria-describedby'] = `help-${fieldId}`;
  }

  if (hasError) {
    props['aria-describedby'] = props['aria-describedby'] 
      ? `${props['aria-describedby']} error-${fieldId}`
      : `error-${fieldId}`;
    props['aria-invalid'] = true;
  }

  if (isRequired) {
    props['aria-required'] = true;
  }

  if (isDisabled) {
    props['aria-disabled'] = true;
  }

  return props;
};

export default fieldStyles;