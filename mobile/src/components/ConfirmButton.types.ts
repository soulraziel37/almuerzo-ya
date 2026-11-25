export type ConfirmButtonProps = {
  /** Texto del botón. */
  title: string;
  /** Encabezado de la confirmación. */
  question: string;
  /** Qué pasará si se confirma. */
  message: string;
  /** Texto de la acción que confirma. */
  confirmLabel: string;
  loading?: boolean;
  isDisabled?: boolean;
  onConfirm: () => void;
};
