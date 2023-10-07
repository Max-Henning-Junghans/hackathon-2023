db = []
db_xzone = []

def read(x: int):
    return db[x]

def read_xzone(x: int):
    return db_xzone[x]

def write(new_element):
    db.append(new_element)

def write_xzone(new_element):
    db_xzone.append(new_element)