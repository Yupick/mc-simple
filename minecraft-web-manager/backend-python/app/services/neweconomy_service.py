"""Servicio para gestionar NewEconomy"""
from pathlib import Path
import yaml
from app.core.config import settings

class NewEconomyService:
    def __init__(self):
        self.plugins_path = Path(settings.SERVER_PATH) / "plugins"
        self.eco_path = self.plugins_path / "NewEconomy"

    def list_config_files(self):
        config_dir = self.eco_path
        if not config_dir.exists():
            return []
        return [str(f.name) for f in config_dir.glob("*.yml")]

    def read_config_file(self, filename):
        file_path = self.eco_path / filename
        if not file_path.exists():
            raise ValueError("Archivo no encontrado")
        return file_path.read_text(encoding="utf-8")

    def write_config_file(self, filename, content):
        file_path = self.eco_path / filename
        file_path.write_text(content, encoding="utf-8")

    def read_main_config(self):
        return self.read_config_file("config.yml")

    def get_visual_config(self):
        try:
            content = self.read_main_config()
            config_data = yaml.safe_load(content)
            return {
                "currency": config_data.get('currency', 'USD'),
                "symbol": config_data.get('currency-symbol', '$'),
                "startingBalance": config_data.get('starting-balance', 0.0),
                "bankEnabled": config_data.get('bank', {}).get('enabled', False),
                "interestEnabled": config_data.get('interest', {}).get('enabled', False),
                "interestRate": config_data.get('interest', {}).get('rate', 0.0),
                "maxBalance": config_data.get('max-balance', 100000.0),
                "multiCurrency": config_data.get('multi-currency', False),
                "transactionFee": config_data.get('transaction-fee', 0.0),
                "playerTransfers": config_data.get('player-transfers', True),
                "transactionLogs": config_data.get('transaction-logs', True),
                "secondaryCurrencies": config_data.get('secondary-currencies', [])
            }
        except Exception:
            return {
                "currency": "USD",
                "symbol": "$",
                "startingBalance": 0.0,
                "bankEnabled": False,
                "interestEnabled": False,
                "interestRate": 0.0,
                "maxBalance": 100000.0,
                "multiCurrency": False,
                "transactionFee": 0.0,
                "playerTransfers": True,
                "transactionLogs": True,
                "secondaryCurrencies": []
            }

    def save_visual_config(self, config):
        try:
            content = self.read_main_config()
            config_data = yaml.safe_load(content)
            config_data['currency'] = config.get('currency', 'USD')
            config_data['currency-symbol'] = config.get('symbol', '$')
            config_data['starting-balance'] = config.get('startingBalance', 0.0)
            if 'bank' not in config_data:
                config_data['bank'] = {}
            config_data['bank']['enabled'] = config.get('bankEnabled', False)
            if 'interest' not in config_data:
                config_data['interest'] = {}
            config_data['interest']['enabled'] = config.get('interestEnabled', False)
            config_data['interest']['rate'] = config.get('interestRate', 0.0)
            config_data['max-balance'] = config.get('maxBalance', 100000.0)
            config_data['multi-currency'] = config.get('multiCurrency', False)
            config_data['transaction-fee'] = config.get('transactionFee', 0.0)
            config_data['player-transfers'] = config.get('playerTransfers', True)
            config_data['transaction-logs'] = config.get('transactionLogs', True)
            config_data['secondary-currencies'] = config.get('secondaryCurrencies', [])
            self.write_config_file("config.yml", yaml.safe_dump(config_data, allow_unicode=True))
            return {"success": True, "message": "Configuración guardada correctamente"}
        except Exception as e:
            return {"success": False, "error": str(e)}

neweconomy_service = NewEconomyService()
