const APP_CONFIG = {
  // 页面全局配置
  page: {
    title: "NFC",
    brandColor: "#007AFF", // 充电宝品牌色（刷新按钮等可复用）
  },
  
  // 缓存策略配置
  cache: {
    expireMinutes: 5, // 相同 URL 参数缓存 5 分钟
  },

  // 页面区块与参数映射配置
  // 根据图2结构，分为：顶部核心信息(hero)、电池电压(list)、整体电气信息(list)、容量信息(list)、设备信息(list)
  sections: [
    {
      id: "summary",
      type: "hero",
      items: [
        { key: "temperature", label: "温度", unit: "", default: "--", formatter: (val) => Number(val).toFixed(1) },
        { key: "health_status", label: "电池健康状态", unit: "", default: "未知" }
      ]
    },
    {
      id: "cell_voltages",
      type: "list",
      items: [
        { key: "cell1_vol", label: "第1节电池电压", unit: " mV", default: "--" },
        { key: "cell2_vol", label: "第2节电池电压", unit: " mV", default: "--" },
        { key: "cell3_vol", label: "第3节电池电压", unit: " mV", default: "--" },
        { key: "cell4_vol", label: "第4节电池电压", unit: " mV", default: "--" }
      ]
    },
    {
      id: "electrical",
      type: "list",
      items: [
        { key: "battery", label: "电池电压", unit: " mV", default: "--" },
        { key: "current", label: "电流", unit: " mA", default: "--" },
        { key: "temperature_c", label: "温度", unit: " °C", default: "--", formatter: (val) => Number(val).toFixed(1) },
        { key: "power", label: "端口功率", unit: " W", default: "--" }
      ]
    },
    {
      id: "capacity",
      type: "list",
      items: [
        { key: "number_of_charging_cycles", label: "电池循环", unit: " 次", default: "--" },
        { key: "max_capacity", label: "最大容量", unit: " mAh", default: "--" },
        { key: "used_max_capacity", label: "使用最大容量", unit: " mAh", default: "--" },
        { key: "current_capacity", label: "当前容量", unit: " mAh", default: "--" },
        { key: "life_percentage", label: "电池寿命", unit: "%", default: "--" }
      ]
    },
    {
      id: "device_info",
      type: "list",
      items: [
        { key: "modelnumber", label: "产品型号", unit: "", default: "--" },
        { key: "brand", label: "品牌", unit: "", default: "--" },
        { key: "battery_vendor", label: "电池厂商", unit: "", default: "--" },
        { key: "manufacturer", label: "生产厂商", unit: "", default: "--" },
        { key: "production_date", label: "生产时间", unit: "", default: "--" },
        { key: "serial_number", label: "序列号", unit: "", default: "--" }
      ]
    }
  ],

  // 告警阈值颜色配置
  alerts: {
    temperature: { max: 45, color: "#FF3B30" }, // 超过45度标红
    life_percentage: { min: 80, color: "#FF3B30" } // 寿命低于80%标红
  }
};
