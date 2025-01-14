# -*- coding: utf-8 -*-
"""
Created on Mon Jan 13 14:58:49 2025

@author: Matth
"""

import os
import duckdb
import datetime
from datetime import datetime
import urllib
import sqlalchemy
from sqlalchemy  import create_engine, Column, Integer, String, Text, Boolean, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
import pandas as pd
import time
import pickle
# Define your database credentials
db_user = "tsdbadmin"
db_password = "vfwzgoggtutrzdtq"
db_host = "wx5jn4qq73.u70ro5y2c0.tsdb.cloud.timescale.com"  # Or your server address
db_port = "30274"       # Default PostgreSQL port
db_name = "tsdb"

# Create the engine
engine = create_engine(f"postgresql+psycopg2://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}")

# Test the connection
with engine.connect() as connection:
    print("Connection successful!")

conn = engine.connect()
# Define the base class
Base = declarative_base()
query1 = text("Drop Table If Exists Npasses")
conn.execute(query1)
# Define the table
class Npasses(Base):
    
    __tablename__ = 'Npass_Orders'
    
    ID = Column(Integer, primary_key=True, autoincrement=True)
    Order_Number = Column(String(6), nullable=False)
    Datetime = Column(DateTime, nullable=False)
    Username = Column(String(40), nullable=False)
    image_link = Column(Text, nullable=False)
    date_fulfilled = Column(Date)
    Minted = Column(Boolean, default=False)


# Create the table
Base.metadata.create_all(engine)
print("Table Npasses created successfully.")

#Gen list for insertions

Directory = (r"C:\Users\Matth\Downloads\NwordpassesWebsite")
last_run = 'last_run.pkl'


def file_path_selection(Directory):
    file_paths = []
    try:
        with open(last_run, 'rb') as f:
                last_timestamp = pickle.load(f)
    except (FileNotFoundError, EOFError):
                print("last run not found.... starting from zero")
                last_timestamp = 0.0
    
    for root,dirs,files in os.walk(Directory):
        for file in files:
            if file.endswith('.csv'):
                file_path = os.path.join(root,file)
                creation_time = os.path.getctime(file_path)
                
                if creation_time > last_timestamp:
                    file_paths.append(file_path)
                    readable_creation_time = datetime.fromtimestamp(creation_time)
                    
                    return file_paths
                


file_paths = file_path_selection(Directory)
                
def process_data(file_paths):
    insertions = []
    headers = ['Order_Number','Datetime','Username','image_link']
    for file_path in file_paths:
        creation_time = os.path.getctime(file_path)
        readable_creation_time = datetime.fromtimestamp(creation_time)
        df = pd.read_csv(file_path,index_col=False)
        Username = df['Twitter Username'][0]
        date_sub = df['Date Submitted'][0]
        Order_Number = df['Date Submitted'][0][:4] + Username[:2]
        try:
            image_link = df['PNG Link'][0]
        except:    
            image_link = 'Check Email'
        insertions.append([Order_Number,readable_creation_time,Username,image_link])
    insertion_df = pd.DataFrame(data=insertions,columns=headers)
    insertion_df.to_sql(name = 'Npass_Orders', con = engine, if_exists='append',index=False)
    print("Insertions Complete")
