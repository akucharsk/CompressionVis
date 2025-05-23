
import humps

def _base(data, func):
    if isinstance(data, dict):
        return {func(key): _base(value, func) for key, value in data.items()}
    if isinstance(data, list):
        return [_base(value, func) for value in data]
    return data

def camelize(data):
    return _base(data, humps.camelize)

def decamelize(data):
    return _base(data, humps.decamelize)
