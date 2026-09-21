export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: { id: number; nombre: string };
        Insert: { id?: number; nombre: string };
        Update: { nombre?: string };
        Relationships: [];
      };
      categoria_caracteristica: {
        Row: { id: number; categoria_id: number; clave: string; etiqueta: string; tipo: "lista" | "entero"; valores: string[]; minimo: number | null; maximo: number | null; obligatoria: boolean };
        Insert: { categoria_id: number; clave: string; etiqueta: string; tipo?: "lista" | "entero"; valores?: string[]; minimo?: number | null; maximo?: number | null; obligatoria?: boolean };
        Update: { etiqueta?: string; valores?: string[]; obligatoria?: boolean };
        Relationships: [{ foreignKeyName: "categoria_caracteristica_categoria_id_fkey"; columns: ["categoria_id"]; isOneToOne: false; referencedRelation: "categorias"; referencedColumns: ["id"] }];
      };
      compra_opcion: {
        Row: { id: number; categoria: string; producto_id: number | null; clave: string; etiqueta: string; valores: string[] };
        Insert: { id?: number; categoria: string; producto_id?: number | null; clave: string; etiqueta: string; valores: string[] };
        Update: { categoria?: string; producto_id?: number | null; clave?: string; etiqueta?: string; valores?: string[] };
        Relationships: [];
      };
      cliente: {
        Row: {
          direccion: string | null
          id: number
          localidad: string | null
          nombre: string
          observaciones: string | null
          telefono: string | null
        }
        Insert: {
          direccion?: string | null
          id?: number
          localidad?: string | null
          nombre: string
          observaciones?: string | null
          telefono?: string | null
        }
        Update: {
          direccion?: string | null
          id?: number
          localidad?: string | null
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      detalle_pedido: {
        Row: {
          cantidad: number
          color: string
          id: number
          pedido_id: number
          precio_costo_usd: number
          producto_id: number
        }
        Insert: {
          cantidad: number
          color: string
          id?: number
          pedido_id: number
          precio_costo_usd?: number
          producto_id: number
        }
        Update: {
          cantidad?: number
          color?: string
          id?: number
          pedido_id?: number
          precio_costo_usd?: number
          producto_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_detalle_pedido_pedido"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_detalle_pedido_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido: {
        Row: {
          cerrado_en: string | null
          costo_envio_usd: number
          estado: string
          fecha_estimada: string | null
          fecha_pedido: string | null
          id: number
          observaciones: string | null
          proveedor_id: number
          solicitud_id: string | null
        }
        Insert: {
          cerrado_en?: string | null
          costo_envio_usd: number
          estado?: string
          fecha_estimada?: string | null
          fecha_pedido?: string | null
          id?: number
          observaciones?: string | null
          proveedor_id: number
          solicitud_id?: string | null
        }
        Update: {
          cerrado_en?: string | null
          costo_envio_usd?: number
          estado?: string
          fecha_estimada?: string | null
          fecha_pedido?: string | null
          id?: number
          observaciones?: string | null
          proveedor_id?: number
          solicitud_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_pedido_proveedor"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedor"
            referencedColumns: ["id"]
          },
        ]
      }
      producto: {
        Row: {
          atributos?: Record<string, string>
          categoria_id?: number
          categoria: string
          id: number
          marca: string
          nombre: string
        }
        Insert: {
          atributos?: Record<string, string>
          categoria_id?: number
          categoria: string
          id?: number
          marca: string
          nombre: string
        }
        Update: {
          atributos?: Record<string, string>
          categoria_id?: number
          categoria?: string
          id?: number
          marca?: string
          nombre?: string
        }
        Relationships: []
      }
      proveedor: {
        Row: {
          contacto: string | null
          direccion: string | null
          horario_desde: string | null
          horario_hasta: string | null
          id: number
          nombre: string
          observaciones: string | null
          telefono: string | null
        }
        Insert: {
          contacto?: string | null
          direccion?: string | null
          horario_desde?: string | null
          horario_hasta?: string | null
          id?: number
          nombre: string
          observaciones?: string | null
          telefono?: string | null
        }
        Update: {
          contacto?: string | null
          direccion?: string | null
          horario_desde?: string | null
          horario_hasta?: string | null
          id?: number
          nombre?: string
          observaciones?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      reporte_config: {
        Row: {
          chart_type: string
          created_at: string
          dimension: string
          id: string
          metric: string
          state: string
          title: string
        }
        Insert: {
          chart_type: string
          created_at?: string
          dimension: string
          id?: string
          metric: string
          state: string
          title: string
        }
        Update: {
          chart_type?: string
          created_at?: string
          dimension?: string
          id?: string
          metric?: string
          state?: string
          title?: string
        }
        Relationships: []
      }
      unidad: {
        Row: {
          cliente_id: number | null
          codigo: string | null
          color: string
          comision_usd: number | null
          costo_envio_usd: number
          detalle_pedido_id: number | null
          estado: string
          fecha_entrega: string | null
          fecha_garantia: string | null
          fecha_ingreso_stock: string
          fecha_retiro: string
          fecha_venta: string | null
          garantia: boolean
          id: number
          observaciones: string | null
          pago_verificado: boolean
          pedido_id: number
          precio_costo_usd: number
          precio_sugerido_usd: number | null
          precio_venta_usd: number | null
          producto_id: number
          ram: string | null
          solicitud_venta_id: string | null
          variante: string | null
          vendedor_id: number | null
        }
        Insert: {
          cliente_id?: number | null
          codigo?: string | null
          color: string
          comision_usd?: number | null
          costo_envio_usd: number
          detalle_pedido_id?: number | null
          estado: string
          fecha_entrega?: string | null
          fecha_garantia?: string | null
          fecha_ingreso_stock?: string
          fecha_retiro: string
          fecha_venta?: string | null
          garantia?: boolean
          id?: number
          observaciones?: string | null
          pago_verificado?: boolean
          pedido_id: number
          precio_costo_usd: number
          precio_sugerido_usd?: number | null
          precio_venta_usd?: number | null
          producto_id: number
          ram?: string | null
          solicitud_venta_id?: string | null
          variante?: string | null
          vendedor_id?: number | null
        }
        Update: {
          cliente_id?: number | null
          codigo?: string | null
          color?: string
          comision_usd?: number | null
          costo_envio_usd?: number
          detalle_pedido_id?: number | null
          estado?: string
          fecha_entrega?: string | null
          fecha_garantia?: string | null
          fecha_ingreso_stock?: string
          fecha_retiro?: string
          fecha_venta?: string | null
          garantia?: boolean
          id?: number
          observaciones?: string | null
          pago_verificado?: boolean
          pedido_id?: number
          precio_costo_usd?: number
          precio_sugerido_usd?: number | null
          precio_venta_usd?: number | null
          producto_id?: number
          ram?: string | null
          solicitud_venta_id?: string | null
          variante?: string | null
          vendedor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_unidad_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unidad_pedido"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unidad_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_unidad_vendedor"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidad_detalle_pedido_id_fkey"
            columns: ["detalle_pedido_id"]
            isOneToOne: false
            referencedRelation: "detalle_pedido"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedor: {
        Row: {
          id: number
          nombre: string
          observaciones: string | null
          porcentaje_comision: number
          telefono: string | null
        }
        Insert: {
          id?: number
          nombre: string
          observaciones?: string | null
          porcentaje_comision: number
          telefono?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          observaciones?: string | null
          porcentaje_comision?: number
          telefono?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      pgl_generate_orders: { Args: { p_ids: Json }; Returns: number }
      pgl_receive_and_pay_order: { Args: { p_id: number; p_units: Json; p_amount: number }; Returns: undefined }
      pgl_create_product: { Args: { p_category: number; p_name: string; p_brand: string }; Returns: number }
      pgl_add_category_value: { Args: { p_characteristic: number; p_value: string }; Returns: string }
      pgl_add_sale_payment: { Args: { p_id: number; p_amount: number; p_request: string; p_delivered: boolean }; Returns: number }
      pgl_create_sale_partial: { Args: { p_unit: number; p_client: number; p_seller: number; p_date: string; p_price: number; p_commission: number; p_amount: number; p_request: string; p_delivered: boolean }; Returns: number }
      pgl_close_day: { Args: { p_date: string }; Returns: number }
      pgl_create_order: {
        Args: {
          p_date: string
          p_expected: string | null
          p_lines: Json
          p_notes: string
          p_request: string
          p_shipping: number
          p_supplier: number
        }
        Returns: number
      }
      pgl_create_sale: {
        Args: {
          p_client: number
          p_commission: number
          p_date: string
          p_paid: boolean
          p_price: number
          p_request: string
          p_seller: number
          p_unit: number
        }
        Returns: number
      }
      pgl_deliver: { Args: { p_id: number }; Returns: undefined }
      pgl_order_status: {
        Args: { p_id: number; p_status: string }
        Returns: undefined
      }
      pgl_receive_order: {
        Args: { p_id: number; p_units: Json }
        Returns: undefined
      }
      pgl_set_payment: {
        Args: { p_id: number; p_paid: boolean }
        Returns: undefined
      }
      pgl_snapshot: { Args: never; Returns: Json }
      pgl_update_stock: {
        Args: {
          p_code: string
          p_id: number
          p_ram: string
          p_suggested?: number
          p_variant: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
