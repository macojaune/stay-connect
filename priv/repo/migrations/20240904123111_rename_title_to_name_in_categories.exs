defmodule StayConnect.Repo.Migrations.RenameTitleToNameInCategories do
  use Ecto.Migration

  def up do
    rename table(:categories), :title, to: :name
  end

  def down do
    rename table(:categories), :name, to: :title
  end
end
